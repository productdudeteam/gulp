"""
Widget Token Service

Business logic for widget token management.
Handles token generation, validation, and CRUD operations.
"""

import secrets
import hashlib
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import logging

from core.exceptions import ValidationError, NotFoundError, AuthorizationError
from repositories.widget_token_repo import WidgetTokenRepository
from services.bot_service import BotService
from services.plan_service import PlanService

logger = logging.getLogger(__name__)


class WidgetTokenService:
    """Service for widget token operations"""

    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize the service.

        Args:
            access_token: User's JWT token for RLS-enabled operations
        """
        self.access_token = access_token
        self.repository = WidgetTokenRepository(access_token=access_token)

    def _generate_token(self) -> tuple[str, str]:
        """
        Generate a secure random token and its hash.

        Returns:
            Tuple of (plain_token, token_hash)
        """
        # Generate a secure random token (64 bytes = 512 bits)
        plain_token = secrets.token_urlsafe(64)
        
        # Hash the token using SHA-256
        token_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        
        # Get first 8 characters for identification (shown to user)
        token_prefix = plain_token[:8]
        
        return plain_token, token_hash, token_prefix

    def create_token(
        self,
        bot_id: UUID,
        user_id: UUID,
        allowed_domains: List[str],
        name: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> dict:
        """
        Create a new widget token for a bot.

        Args:
            bot_id: ID of the bot
            user_id: ID of the user creating the token (for authorization)
            allowed_domains: List of allowed domains
            name: Optional descriptive name
            expires_at: Optional expiration date

        Returns:
            Dictionary with token data and plain token (shown only once)

        Raises:
            ValidationError: If validation fails
            AuthorizationError: If user doesn't own the bot
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot = bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        # Get user plan to check limits
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        # Check widget token limit per bot
        existing_tokens = self.get_tokens_by_bot(bot_id, user_id)
        current_token_count = len(existing_tokens)
        
        # Check if widget token limit is exceeded
        is_within_limit, error_msg = plan_service.check_plan_limit(
            plan=user_plan,
            limit_key="max_widget_tokens_per_bot",
            current_count=current_token_count,
            entity_name="widget tokens"
        )
        
        if not is_within_limit:
            logger.warning(f"Widget token limit exceeded: bot_id={bot_id}, current={current_token_count}, limit={user_plan.get('max_widget_tokens_per_bot')}")
            raise ValidationError(error_msg or "Widget token limit exceeded")

        # Validate expiration date
        from datetime import timezone
        if expires_at:
            # Ensure expires_at is timezone-aware
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at <= datetime.now(timezone.utc):
                raise ValidationError("Expiration date must be in the future")

        # Generate token and hash
        plain_token, token_hash, token_prefix = self._generate_token()

        # Create token in database
        token_data = self.repository.create_token(
            bot_id=bot_id,
            token_hash=token_hash,
            token_prefix=token_prefix,
            allowed_domains=allowed_domains,
            name=name,
            expires_at=expires_at,
        )

        logger.info(f"Created widget token for bot {bot_id} by user {user_id}")

        # Return token data with plain token (shown only once)
        return {
            **token_data,
            "token": plain_token,  # Only returned during creation
        }

    def get_tokens_by_bot(self, bot_id: UUID, user_id: UUID) -> List[dict]:
        """
        Get all tokens for a bot.

        Args:
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)

        Returns:
            List of token records

        Raises:
            AuthorizationError: If user doesn't own the bot
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        return self.repository.get_tokens_by_bot(bot_id)

    def validate_token(self, token: str, origin: Optional[str] = None) -> Optional[dict]:
        """
        Validate a widget token.

        Args:
            token: Plain token to validate
            origin: Origin/domain of the request (optional)

        Returns:
            Token record if valid, None otherwise
        """
        try:
            # Hash the provided token
            token_hash = hashlib.sha256(token.encode()).hexdigest()

            # Get token from database
            token_data = self.repository.get_token_by_hash(token_hash)

            if not token_data:
                logger.warning("Token not found")
                return None

            # Check expiration
            from datetime import timezone
            if token_data.get("expires_at"):
                expires_at_str = token_data["expires_at"]
                # Handle different timestamp formats
                if expires_at_str.endswith("Z"):
                    expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                else:
                    expires_at = datetime.fromisoformat(expires_at_str)
                
                # Ensure timezone-aware
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if expires_at <= datetime.now(timezone.utc):
                    logger.warning(f"Token {token_data['id']} has expired")
                    return None

            # Check domain whitelist
            allowed_domains = token_data.get("allowed_domains", [])
            
            # Check if we're in development mode (allows origin=None for testing)
            from config.settings import settings
            is_dev = settings.environment.lower() in ["dev", "local"]
            
            # If token has allowed_domains configured, origin validation is required
            if allowed_domains:
                if not origin:
                    # Origin is required when allowed_domains are set (unless dev mode)
                    if not is_dev:
                        logger.warning(f"Origin required for token {token_data['id']} with allowed_domains")
                        return None
                    # In dev mode, allow origin=None for testing even with allowed_domains
                    logger.debug(f"Dev mode: Allowing origin=None for token {token_data['id']} with allowed_domains")
                else:
                    # Origin provided - validate it matches allowed domains
                    origin_normalized = origin.rstrip("/")
                    
                    # Check if origin matches any allowed domain
                    domain_match = False
                    for domain in allowed_domains:
                        domain_normalized = domain.rstrip("/")
                        # Exact match or subdomain match
                        if (origin_normalized == domain_normalized or
                            origin_normalized.endswith(f".{domain_normalized}") or
                            origin_normalized.startswith(domain_normalized)):
                            domain_match = True
                            break

                    if not domain_match:
                        logger.warning(f"Origin {origin} not in allowed domains for token {token_data['id']}::{allowed_domains}")
                        return None
            else:
                # If no allowed_domains configured, check environment
                if not origin and not is_dev:
                    # In production, origin is required even if no domain restrictions
                    logger.warning(f"Origin required in production for token {token_data['id']}")
                    return None
                # In dev mode, allow origin=None for tokens without domain restrictions

            # Update last_used_at
            self.repository.update_last_used(UUID(token_data["id"]))

            return token_data

        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return None

    def revoke_token(self, token_id: UUID, bot_id: UUID, user_id: UUID) -> bool:
        """
        Revoke (delete) a widget token.

        Args:
            token_id: ID of the token to revoke
            bot_id: ID of the bot
            user_id: ID of the user (for authorization)

        Returns:
            True if revoked successfully

        Raises:
            AuthorizationError: If user doesn't own the bot
            NotFoundError: If token not found
            DatabaseError: If database operation fails
        """
        # Verify user owns the bot
        bot_service = BotService()
        bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)

        return self.repository.delete_token(token_id, bot_id)

