from typing import List, Optional, Dict, Any
from uuid import UUID
import logging
import time

from config.supabasedb import get_supabase_client
from services.embedding_service import EmbeddingService
from services.llm_service import LLMService
from services.bot_service import BotService
from repositories.query_repo import QueryRepository
from core.exceptions import ValidationError, DatabaseError

logger = logging.getLogger(__name__)


class RagService:
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token
        self.db = get_supabase_client(access_token=access_token)
        self.embedding = EmbeddingService(access_token=access_token)
        self.query_repo = QueryRepository(access_token=access_token)

    def retrieve(self, bot_id: UUID, query_text: str, top_k: int = 5, min_score: float = 0.25) -> List[Dict[str, Any]]:
        if not query_text or not query_text.strip():
            raise ValidationError("query_text is required")

        # Embed query (single-vector batch)
        vectors, provider = self.embedding._embed_with_fallback([query_text])
        query_vec = vectors[0]
        logger.info(f"Query embedded using provider {provider}")

        # Call SQL function search_similar_chunks(bot_id, embedding, threshold, limit)
        try:
            # Supabase Python client: use rpc with exact SQL arg names
            response = self.db.rpc(
                "search_similar_chunks",
                {
                    "bot_uuid": str(bot_id),
                    "query_embedding": query_vec,
                    "match_threshold": float(min_score),
                    "match_count": int(top_k),
                },
            ).execute()

            data = response.data or []
            logger.info(f"Retrieved {len(data)} chunks for query")
            return data
        except Exception as e:
            logger.error(f"Error during retrieval: {str(e)}")
            raise DatabaseError(f"Retrieval failed: {str(e)}")

    def answer(self, bot_id: UUID, user_id: Optional[str], query_text: str, top_k: int = 5, min_score: float = 0.25, session_id: Optional[str] = None, page_url: Optional[str] = None) -> Dict[str, Any]:
        # Retrieve context
        t0 = time.time()
        chunks = self.retrieve(bot_id, query_text, top_k=top_k, min_score=min_score)
        context = "\n\n".join([c.get("excerpt", "") for c in chunks])
        citations = [
            {
                "chunk_id": c.get("id"),
                "heading": c.get("heading"),
                "score": c.get("similarity"),
            }
            for c in chunks
        ]

        # Fetch bot to verify ownership and get system_prompt
        bot_service = BotService()
        bot = None
        if user_id:
            bot = bot_service.get_bot(str(bot_id), str(user_id), access_token=self.access_token)
        system_prompt = (bot or {}).get("system_prompt") if isinstance(bot, dict) else None
        system_prompt = system_prompt or "You are a helpful assistant. Use the provided context to answer. If unsure, say you don't know."

        prompt = (
            f"System prompt: {system_prompt}\n\n"
            f"Context:\n{context}\n\n"
            f"User question: {query_text}\n\n"
            f"Answer concisely and cite sources by heading if helpful."
        )

        llm = LLMService()
        answer_text, usage, provider_used = llm.generate(prompt)
        latency_ms = int((time.time() - t0) * 1000)

        result = {
            "answer": answer_text,
            "citations": citations,
            "context_preview": context[:1000],
        }

        # Log query
        try:
            sid = session_id or "server-session"
            self.query_repo.create_query(
                bot_id=bot_id,
                session_id=sid,
                query_text=query_text,
                page_url=page_url,
                returned_sources=citations,
                response_summary=answer_text[:2000],
                tokens_used=(usage.get("total_tokens") if isinstance(usage, dict) else 0) or 0,
                prompt_tokens=(usage.get("prompt_tokens") if isinstance(usage, dict) else None),
                completion_tokens=(usage.get("completion_tokens") if isinstance(usage, dict) else None),
                confidence=None,
                latency_ms=latency_ms,
            )
        except Exception as e:
            logger.warning(f"Failed to log query: {e}")

        return result


