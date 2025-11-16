"""
Plan API Controller

Handles subscription plan endpoints.
"""

from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional
import logging

from middleware.auth_guard import auth_guard
from services.plan_service import PlanService
from models.plan_model import PlanResponse, UserPlanResponseModel, SubscriptionPlanModel
from core.exceptions import DatabaseError, NotFoundError

logger = logging.getLogger(__name__)

plan_router = APIRouter()


@plan_router.get("/user/plan")
@auth_guard
async def get_user_plan(request: Request):
    """
    Get the current user's active subscription plan.
    
    Returns the plan details including limits and feature flags.
    """
    try:
        user_data = request.state.user
        user_id = getattr(user_data, 'id', None)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        plan_service = PlanService(use_service_role=True)
        plan_data = plan_service.get_plan_for_user(str(user_id))
        
        if not plan_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found"
            )
        
        # Format response
        plan_model = SubscriptionPlanModel(**plan_data)
        user_plan_response = UserPlanResponseModel(
            plan=plan_model,
            subscription_id=plan_data.get("subscription_id"),
            status=plan_data.get("subscription_status", "active"),
            starts_at=plan_data.get("subscription_starts_at"),
            ends_at=plan_data.get("subscription_ends_at"),
        )
        
        return PlanResponse(
            status="success",
            data=user_plan_response,
            message="User plan retrieved successfully"
        )
        
    except NotFoundError as e:
        logger.error(f"Plan not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    except DatabaseError as e:
        logger.error(f"Database error getting user plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user plan"
        )
    except Exception as e:
        logger.error(f"Unexpected error getting user plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

