"""
Source Service

Business logic for source management.
Handles file uploads and URL submissions.
"""

from typing import List, Optional
from uuid import UUID
import logging
from urllib.parse import urlparse

from core.exceptions import ValidationError, NotFoundError, AuthorizationError, DatabaseError
from repositories.source_repo import SourceRepository
from services.bot_service import BotService
from services.plan_service import PlanService
from models.source_model import SourceType, SourceStatus
from config.supabasedb import get_supabase_client

logger = logging.getLogger(__name__)


class SourceService:
    """Service for source operations"""

    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize the service.

        Args:
            access_token: User's JWT token for RLS-enabled operations
        """
        self.access_token = access_token
        self.repository = SourceRepository(access_token=access_token)

    def _validate_url(self, url: str) -> tuple[str, str]:
        """
        Validate and normalize a URL.

        Args:
            url: URL to validate

        Returns:
            Tuple of (canonical_url, normalized_url)

        Raises:
            ValidationError: If URL is invalid
        """
        try:
            parsed = urlparse(url)
            
            # Must have scheme and netloc
            if not parsed.scheme or not parsed.netloc:
                raise ValidationError(f"Invalid URL format: {url}")
            
            # Only allow http and https
            if parsed.scheme not in ("http", "https"):
                raise ValidationError(f"Only http and https URLs are allowed. Got: {parsed.scheme}")
            
            # Normalize URL (remove fragment, default ports, trailing slashes)
            canonical_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
            if parsed.query:
                canonical_url += f"?{parsed.query}"
            
            return canonical_url, url

        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(f"Invalid URL: {str(e)}")

    def create_file_source(
        self,
        bot_id: UUID,
        user_id: UUID,
        source_type: SourceType,
        storage_path: str,
        file_size: int,
        mime_type: Optional[str] = None,
    ) -> dict:
        """
        Create a source record for an uploaded file.

        Args:
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)
            source_type: Type of source (pdf, docx, text)
            storage_path: Path in storage (Supabase Storage/S3)
            file_size: File size in bytes
            mime_type: Optional MIME type

        Returns:
            Created source record

        Raises:
            ValidationError: If validation fails
            AuthorizationError: If user doesn't own the bot
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        # Validate source type for files
        if source_type not in (SourceType.PDF, SourceType.DOCX, SourceType.TEXT):
            raise ValidationError(f"Invalid source type for file upload: {source_type}")

        # Get user plan to check limits
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        # Check document limit per bot
        existing_sources = self.get_sources_by_bot(bot_id, user_id)
        # Count document sources (pdf, docx, text) for this bot
        document_sources = [s for s in existing_sources if s.get("source_type") in ("pdf", "docx", "text")]
        current_doc_count = len(document_sources)
        
        # Check if document limit is exceeded
        is_within_limit, error_msg = plan_service.check_plan_limit(
            plan=user_plan,
            limit_key="max_docs_per_bot",
            current_count=current_doc_count,
            entity_name="documents"
        )
        
        if not is_within_limit:
            logger.warning(f"Document limit exceeded: bot_id={bot_id}, current={current_doc_count}, limit={user_plan.get('max_docs_per_bot')}")
            raise ValidationError(error_msg or "Document limit exceeded")
        
        # Check file size limit based on plan
        max_file_size_mb = user_plan.get("max_doc_size_mb", 5)
        MAX_FILE_SIZE = max_file_size_mb * 1024 * 1024
        if file_size > MAX_FILE_SIZE:
            raise ValidationError(
                f"File size exceeds maximum allowed size of {max_file_size_mb}MB for your plan. "
                f"Payments are coming soon, but if you'd like to use paid features now, "
                f"please email us at info@singlebit.xyz."
            )

        if file_size <= 0:
            raise ValidationError("File size must be greater than 0")

        # Create source record
        source_data = {
            "bot_id": str(bot_id),
            "source_type": source_type.value,
            "storage_path": storage_path,
            "status": SourceStatus.UPLOADED.value,
            "file_size": file_size,
            "mime_type": mime_type,
        }

        return self.repository.create_source(source_data)

    def create_url_source(
        self,
        bot_id: UUID,
        user_id: UUID,
        url: str,
    ) -> dict:
        """
        Create a source record for a URL.

        Args:
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)
            url: URL to add as source

        Returns:
            Created source record

        Raises:
            ValidationError: If validation fails
            AuthorizationError: If user doesn't own the bot
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        # Get user plan to check limits
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        # Check URL limit per bot
        existing_sources = self.get_sources_by_bot(bot_id, user_id)
        # Count URL sources (html) for this bot
        url_sources = [s for s in existing_sources if s.get("source_type") == "html"]
        current_url_count = len(url_sources)
        
        # Check if URL limit is exceeded
        is_within_limit, error_msg = plan_service.check_plan_limit(
            plan=user_plan,
            limit_key="max_urls_per_bot",
            current_count=current_url_count,
            entity_name="URLs"
        )
        
        if not is_within_limit:
            logger.warning(f"URL limit exceeded: bot_id={bot_id}, current={current_url_count}, limit={user_plan.get('max_urls_per_bot')}")
            raise ValidationError(error_msg or "URL limit exceeded")

        # Validate and normalize URL
        canonical_url, original_url = self._validate_url(url)

        # Create source record
        source_data = {
            "bot_id": str(bot_id),
            "source_type": SourceType.HTML.value,
            "original_url": original_url,
            "canonical_url": canonical_url,
            "storage_path": canonical_url,  # For URLs, storage_path is the URL itself
            "status": SourceStatus.UPLOADED.value,
        }

        return self.repository.create_source(source_data)

    def get_sources_by_bot(self, bot_id: UUID, user_id: UUID) -> List[dict]:
        """
        Get all sources for a bot.

        Args:
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)

        Returns:
            List of source records

        Raises:
            AuthorizationError: If user doesn't own the bot
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        return self.repository.get_sources_by_bot(bot_id)

    def get_source(self, source_id: UUID, bot_id: UUID, user_id: UUID) -> dict:
        """
        Get a source by ID.

        Args:
            source_id: ID of the source
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)

        Returns:
            Source record

        Raises:
            AuthorizationError: If user doesn't own the bot
            NotFoundError: If source not found
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        source = self.repository.get_source_by_id(source_id)
        if not source:
            raise NotFoundError("Source", str(source_id))

        # Verify source belongs to bot
        if source.get("bot_id") != str(bot_id):
            raise AuthorizationError("Source does not belong to this bot")

        return source

    def delete_source(self, source_id: UUID, bot_id: UUID, user_id: UUID) -> bool:
        """
        Delete a source and its associated file from storage.

        Args:
            source_id: ID of the source to delete
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)

        Returns:
            True if deleted successfully

        Raises:
            AuthorizationError: If user doesn't own the bot
            NotFoundError: If source not found
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        # Get source details before deletion to get storage path
        source = self.repository.get_source_by_id(source_id)
        if not source:
            raise NotFoundError("Source", str(source_id))

        storage_path = source.get("storage_path")
        source_type = source.get("source_type")

        # Delete file from storage if it's a file source (not URL)
        if source_type in (SourceType.PDF.value, SourceType.DOCX.value, SourceType.TEXT.value) and storage_path:
            try:
                # TODO: check why service role and not token?
                # Use service role to delete from storage (we've already verified ownership)
                storage_client = get_supabase_client(use_service_role=True)
                
                # Delete file from Supabase Storage
                # Storage path format: bots/{bot_id}/sources/{source_id}/{filename}
                # Supabase Storage remove() accepts a list of file paths
                deleted_files = storage_client.storage.from_("sources").remove([storage_path])
                
                if deleted_files:
                    logger.info(f"Deleted file from storage: {storage_path}")
                else:
                    logger.warning(f"Failed to delete file from storage: {storage_path} (file may not exist)")
                    
            except Exception as e:
                # Log error but don't fail the deletion - database row should still be deleted
                logger.error(f"Error deleting file from storage {storage_path}: {str(e)}")
                # Continue with database deletion even if storage deletion fails
        elif source_type == SourceType.HTML.value:
            # URL sources don't have files in storage, nothing to delete
            logger.info(f"Skipping storage deletion for URL source {source_id}")

        # Delete the database row
        return self.repository.delete_source(source_id, bot_id)

