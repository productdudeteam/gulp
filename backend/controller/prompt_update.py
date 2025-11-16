"""
Prompt Update API Controller

Handles system prompt update and history endpoints.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query, Body
from typing import Optional
from uuid import UUID
import logging
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from middleware.auth_guard import auth_guard
from services.prompt_update_service import PromptUpdateService
from services.bot_service import BotService
from services.plan_service import PlanService
from services.llm_service import LLMService
from core.exceptions import ValidationError, DatabaseError, AuthorizationError, NotFoundError

logger = logging.getLogger(__name__)

prompt_update_router = APIRouter()


class PromptUpdateCreateModel(BaseModel):
    """Model for creating a prompt update"""
    new_prompt: str = Field(..., min_length=1, description="New system prompt")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for the update")
    auto_apply: bool = Field(default=False, description="Whether to automatically apply the update")


class PromptGenerateModel(BaseModel):
    """Model for generating a prompt from user feedback"""
    feedback: str = Field(..., min_length=1, description="User feedback about what needs to be updated")


@prompt_update_router.post("/bots/{bot_id}/prompt-updates")
@auth_guard
async def create_prompt_update(
    request: Request,
    bot_id: UUID,
    body: PromptUpdateCreateModel,
):
    """Create a new prompt update (with optional auto-apply)"""
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")

        access_token = None
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        # Check if user has access to train feature
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        can_access, error_msg = plan_service.can_access_feature(user_plan, "train_enabled")
        if not can_access:
            logger.warning(f"Train feature access denied: user_id={user_id}, plan={user_plan.get('plan_key')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg or "Train feature is not available on your plan"
            )

        service = PromptUpdateService(access_token=access_token)
        update = service.create_prompt_update(
            bot_id=bot_id,
            user_id=str(user_id),
            new_prompt=body.new_prompt,
            reason=body.reason,
            auto_apply=body.auto_apply,
        )

        return {
            "status": "success",
            "data": update,
            "message": "Prompt update created successfully" + (" and applied" if body.auto_apply else ""),
        }

    except AuthorizationError as e:
        logger.error(f"Authorization error in create prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        logger.error(f"Validation error in create prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotFoundError as e:
        logger.error(f"Not found error in create prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DatabaseError as e:
        logger.error(f"Database error in create prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@prompt_update_router.get("/bots/{bot_id}/prompt-updates")
@auth_guard
async def get_prompt_updates(
    request: Request,
    bot_id: UUID,
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of updates to return"),
):
    """Get prompt update history for a bot"""
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")

        access_token = None
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        service = PromptUpdateService(access_token=access_token)
        updates = service.get_prompt_history(bot_id, str(user_id), limit=limit)

        return {
            "status": "success",
            "data": updates,
            "message": f"Retrieved {len(updates)} prompt updates",
        }

    except AuthorizationError as e:
        logger.error(f"Authorization error in get prompt updates: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except NotFoundError as e:
        logger.error(f"Not found error in get prompt updates: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DatabaseError as e:
        logger.error(f"Database error in get prompt updates: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get prompt updates: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@prompt_update_router.patch("/bots/{bot_id}/prompt")
@auth_guard
async def apply_prompt_update(
    request: Request,
    bot_id: UUID,
    update_id: UUID = Body(..., embed=True, description="ID of the prompt update to apply"),
):
    """Apply a prompt update to the bot"""
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")

        access_token = None
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        # Check if user has access to train feature
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        can_access, error_msg = plan_service.can_access_feature(user_plan, "train_enabled")
        if not can_access:
            logger.warning(f"Train feature access denied: user_id={user_id}, plan={user_plan.get('plan_key')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg or "Train feature is not available on your plan"
            )

        service = PromptUpdateService(access_token=access_token)
        updated_bot = service.apply_prompt_update(bot_id, str(user_id), update_id)

        return {
            "status": "success",
            "data": updated_bot,
            "message": "Prompt update applied successfully",
        }

    except AuthorizationError as e:
        logger.error(f"Authorization error in apply prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        logger.error(f"Validation error in apply prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotFoundError as e:
        logger.error(f"Not found error in apply prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DatabaseError as e:
        logger.error(f"Database error in apply prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in apply prompt update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@prompt_update_router.post("/bots/{bot_id}/prompt/revert")
@auth_guard
async def revert_prompt(
    request: Request,
    bot_id: UUID,
    update_id: UUID = Body(..., embed=True, description="ID of the prompt update to revert to"),
):
    """Revert bot to a previous prompt version"""
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")

        access_token = None
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        # Check if user has access to train feature
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        can_access, error_msg = plan_service.can_access_feature(user_plan, "train_enabled")
        if not can_access:
            logger.warning(f"Train feature access denied: user_id={user_id}, plan={user_plan.get('plan_key')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg or "Train feature is not available on your plan"
            )

        service = PromptUpdateService(access_token=access_token)
        updated_bot = service.revert_to_prompt(bot_id, str(user_id), update_id)

        return {
            "status": "success",
            "data": updated_bot,
            "message": "Prompt reverted successfully",
        }

    except AuthorizationError as e:
        logger.error(f"Authorization error in revert prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        logger.error(f"Validation error in revert prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotFoundError as e:
        logger.error(f"Not found error in revert prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DatabaseError as e:
        logger.error(f"Database error in revert prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in revert prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@prompt_update_router.post("/bots/{bot_id}/prompt/generate")
@auth_guard
async def generate_prompt_from_feedback(
    request: Request,
    bot_id: UUID,
    body: PromptGenerateModel,
):
    """Generate an updated system prompt based on user feedback"""
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")

        access_token = None
        try:
            from controller.source import get_access_token_from_request
            access_token = get_access_token_from_request(request)
        except Exception:
            pass

        # Check if user has access to train feature
        plan_service = PlanService(use_service_role=True)
        user_plan = plan_service.get_plan_for_user(str(user_id))
        
        can_access, error_msg = plan_service.can_access_feature(user_plan, "train_enabled")
        if not can_access:
            logger.warning(f"Train feature access denied: user_id={user_id}, plan={user_plan.get('plan_key')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg or "Train feature is not available on your plan"
            )

        # Get the current bot and its prompt
        bot_service = BotService()
        bot = bot_service.get_bot(str(bot_id), str(user_id), access_token=access_token)
        if not bot:
            raise NotFoundError("Bot", str(bot_id))

        current_prompt = bot.get("system_prompt", "")
        if not current_prompt:
            raise ValidationError("Bot has no existing system prompt")

        # Build the prompt for LLM to generate updated prompt
        generation_prompt = f"""You are an AI assistant helping to improve system prompts for chatbots.

Current System Prompt:
{current_prompt}

User Feedback:
{body.feedback}

Based on the user feedback, generate an improved version of the system prompt. The new prompt should:
1. Address the specific concerns or improvements mentioned in the feedback
2. Maintain the core purpose and functionality of the original prompt
3. Be clear, concise, and effective
4. Only include the updated system prompt text, without any explanations or meta-commentary

Return only the improved system prompt text, nothing else."""

        # Generate updated prompt using LLM
        def _generate():
            llm_service = LLMService()
            updated_prompt, usage, provider = llm_service.generate(generation_prompt)
            # Clean up the response (remove any markdown formatting or extra text)
            updated_prompt = updated_prompt.strip()
            # Remove markdown code blocks if present
            if updated_prompt.startswith("```"):
                lines = updated_prompt.split("\n")
                updated_prompt = "\n".join(lines[1:-1]) if len(lines) > 2 else updated_prompt
            return updated_prompt.strip()

        updated_prompt = await run_in_threadpool(_generate)

        if not updated_prompt:
            raise ValidationError("Failed to generate updated prompt")

        return {
            "status": "success",
            "data": {
                "current_prompt": current_prompt,
                "updated_prompt": updated_prompt,
                "feedback": body.feedback,
            },
            "message": "Prompt generated successfully",
        }

    except AuthorizationError as e:
        logger.error(f"Authorization error in generate prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        logger.error(f"Validation error in generate prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotFoundError as e:
        logger.error(f"Not found error in generate prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in generate prompt: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")

