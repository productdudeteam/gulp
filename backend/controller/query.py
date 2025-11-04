"""
Query API Controller

Handles RAG query endpoint.
"""

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
import logging

from middleware.auth_guard import auth_guard
from services.rag_service import RagService
from core.exceptions import ValidationError, DatabaseError, AuthorizationError

logger = logging.getLogger(__name__)

query_router = APIRouter()


class QueryRequest(BaseModel):
    query_text: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(default=5, ge=1, le=20)
    min_score: Optional[float] = Field(default=0.25, ge=0.0, le=1.0)


@query_router.post("/bots/{bot_id}/query")
@auth_guard
async def query_bot(request: Request, bot_id: UUID, body: QueryRequest):
    try:
        access_token = None
        # Optional: extract token from cookie using existing helper
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        rag = RagService(access_token=access_token)
        result = rag.answer(
            bot_id=bot_id,
            query_text=body.query_text,
            top_k=body.top_k or 5,
            min_score=body.min_score or 0.25,
        )
        return {"status": "success", "data": result}

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error querying bot: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


