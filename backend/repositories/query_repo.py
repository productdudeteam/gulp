from typing import Optional, List, Dict, Any
from uuid import UUID
import logging
import time

from core.exceptions import DatabaseError
from config.supabasedb import get_supabase_client

logger = logging.getLogger(__name__)


class QueryRepository:
    def __init__(self, access_token: Optional[str] = None):
        # For widget queries (access_token=None), use service role
        if access_token is None:
            self.client = get_supabase_client(use_service_role=True)
        else:
            self.client = get_supabase_client(access_token=access_token)

    def create_query(
        self,
        bot_id: UUID,
        session_id: str,
        query_text: str,
        page_url: Optional[str],
        returned_sources: List[Dict[str, Any]],
        response_summary: str,
        tokens_used: int = 0,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        confidence: Optional[float] = None,
        latency_ms: Optional[int] = None,
    ) -> Dict[str, Any]:
        try:
            payload = {
                "bot_id": str(bot_id),
                "session_id": session_id,
                "query_text": query_text,
                "page_url": page_url,
                "returned_sources": returned_sources,
                "response_summary": response_summary,
                "tokens_used": tokens_used,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "confidence": confidence,
                "latency_ms": latency_ms,
            }
            resp = self.client.table("queries").insert(payload).execute()
            if not resp.data:
                raise DatabaseError("Failed to insert query log")
            return resp.data[0]
        except Exception as e:
            logger.error(f"Error inserting query log: {str(e)}")
            raise DatabaseError(f"Failed to insert query log: {str(e)}")


