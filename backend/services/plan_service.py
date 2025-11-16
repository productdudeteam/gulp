"""
Plan Service

Business logic for subscription plans and user plan management.
Handles plan retrieval, limit checking, and feature access control.
"""

from typing import Dict, Any, Optional
from uuid import UUID
import logging

from core.exceptions import DatabaseError, NotFoundError
from config.supabasedb import get_supabase_client
from models.plan_model import SubscriptionPlanModel

logger = logging.getLogger(__name__)


class PlanService:
    """Service for subscription plan operations"""

    def __init__(self, use_service_role: bool = False):
        """
        Initialize the plan service.
        
        Args:
            use_service_role: If True, uses service role client (for backend operations)
        """
        self.use_service_role = use_service_role
        self.client = get_supabase_client(use_service_role=use_service_role)

    def get_plan_by_key(self, plan_key: str) -> Optional[Dict[str, Any]]:
        """
        Get a subscription plan by its key.
        
        Args:
            plan_key: Plan key (e.g., 'free', 'starter', 'growth', 'enterprise')
            
        Returns:
            Plan data dictionary or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Use service role for plan lookups (plans are public data)
            client = get_supabase_client(use_service_role=True)
            
            response = (
                client.table("subscription_plans")
                .select("*")
                .eq("plan_key", plan_key)
                .eq("is_active", True)
                .maybe_single()
                .execute()
            )
            
            return response.data
        except Exception as e:
            logger.error(f"Error fetching plan {plan_key}: {str(e)}")
            raise DatabaseError(f"Failed to fetch plan: {str(e)}")

    def get_plan_for_user(self, user_id: str) -> Dict[str, Any]:
        """
        Get the active subscription plan for a user.
        
        Args:
            user_id: User ID (UUID as string)
            
        Returns:
            Plan data dictionary (defaults to 'free' if no subscription found)
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Use service role to fetch user's subscription
            client = get_supabase_client(use_service_role=True)
            
            # First try to get user's active subscription
            sub_response = (
                client.table("user_subscriptions")
                .select("*, subscription_plans(*)")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .eq("status", "active")
                .maybe_single()
                .execute()
            )
            
            if sub_response.data and sub_response.data.get("subscription_plans"):
                plan_data = sub_response.data["subscription_plans"]
                plan_data["subscription_id"] = sub_response.data["id"]
                plan_data["subscription_status"] = sub_response.data["status"]
                plan_data["subscription_starts_at"] = sub_response.data.get("starts_at")
                plan_data["subscription_ends_at"] = sub_response.data.get("ends_at")
                logger.debug(f"Found active subscription for user {user_id}: {plan_data.get('plan_key')}")
                return plan_data
            
            # No active subscription found, default to free plan
            logger.debug(f"No active subscription found for user {user_id}, defaulting to free plan")
            free_plan = self.get_plan_by_key("free")
            if not free_plan:
                raise DatabaseError("Free plan not found in database")
            
            # Set default subscription info
            free_plan["subscription_id"] = None
            free_plan["subscription_status"] = "active"
            free_plan["subscription_starts_at"] = None
            free_plan["subscription_ends_at"] = None
            return free_plan
            
        except DatabaseError:
            raise
        except Exception as e:
            logger.error(f"Error fetching plan for user {user_id}: {str(e)}")
            raise DatabaseError(f"Failed to fetch user plan: {str(e)}")

    def get_plan_for_bot(self, bot_id: str) -> Dict[str, Any]:
        """
        Get the active subscription plan for the owner of a bot.
        
        Args:
            bot_id: Bot ID (UUID as string)
            
        Returns:
            Plan data dictionary (defaults to 'free' if not found)
            
        Raises:
            DatabaseError: If database operation fails
            NotFoundError: If bot not found
        """
        try:
            # Use service role to fetch bot owner
            client = get_supabase_client(use_service_role=True)
            
            # Get bot to find owner
            bot_response = (
                client.table("bots")
                .select("created_by")
                .eq("id", bot_id)
                .maybe_single()
                .execute()
            )
            
            if not bot_response.data:
                raise NotFoundError("Bot", bot_id)
            
            owner_id = bot_response.data.get("created_by")
            if not owner_id:
                raise DatabaseError(f"Bot {bot_id} has no owner")
            
            # Get plan for bot owner
            return self.get_plan_for_user(str(owner_id))
            
        except (NotFoundError, DatabaseError):
            raise
        except Exception as e:
            logger.error(f"Error fetching plan for bot {bot_id}: {str(e)}")
            raise DatabaseError(f"Failed to fetch bot plan: {str(e)}")

    def check_plan_limit(
        self,
        plan: Dict[str, Any],
        limit_key: str,
        current_count: int,
        entity_name: str = "items"
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a plan limit has been exceeded.
        
        Args:
            plan: Plan data dictionary
            limit_key: Key of the limit to check (e.g., 'max_bots_per_user')
            current_count: Current count of the entity
            entity_name: Human-readable name for the entity (for error messages)
            
        Returns:
            Tuple of (is_within_limit: bool, error_message: Optional[str])
        """
        limit_value = plan.get(limit_key)
        
        # None typically means unlimited
        if limit_value is None:
            return True, None
        
        # Check if limit is exceeded
        if current_count >= limit_value:
            plan_name = plan.get("display_name", "your plan")
            limit_type = limit_key.replace("max_", "").replace("_", " ")
            upgrade_email = "info@singlebit.xyz"
            error_msg = (
                f"You've reached the {limit_type} limit ({limit_value} {entity_name}) "
                f"on the {plan_name} plan. Payments are coming soon, but if you'd like "
                f"to use paid features now, please email us at {upgrade_email}."
            )
            return False, error_msg
        
        return True, None

    def can_access_feature(
        self,
        plan: Dict[str, Any],
        feature_name: str
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a plan allows access to a specific feature.
        
        Args:
            plan: Plan data dictionary
            feature_name: Name of the feature to check (e.g., 'train_enabled')
            
        Returns:
            Tuple of (can_access: bool, error_message: Optional[str])
        """
        feature_enabled = plan.get(feature_name, False)
        
        if not feature_enabled:
            plan_name = plan.get("display_name", "your plan")
            upgrade_email = "info@singlebit.xyz"
            
            # Map feature names to user-friendly messages
            feature_messages = {
                "train_enabled": "Train Mode",
                "analytics_tier": "Advanced Analytics"
            }
            
            feature_display = feature_messages.get(feature_name, feature_name.replace("_", " ").title())
            
            error_msg = (
                f"{feature_display} is not available on the {plan_name} plan. "
                f"Payments are coming soon, but if you'd like to use paid features now, "
                f"please email us at {upgrade_email}."
            )
            return False, error_msg
        
        return True, None

