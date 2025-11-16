from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime


class PlanCategory(str):
    """Plan category enum values"""
    FREE = "free"
    PAID1 = "paid1"
    PAID2 = "paid2"
    ENTERPRISE = "enterprise"


class AnalyticsTier(str):
    """Analytics tier enum values"""
    BASIC = "basic"
    FULL = "full"


class SubscriptionPlanModel(BaseModel):
    """Model for subscription plan data"""
    plan_key: str = Field(..., description="Plan key identifier (free, starter, growth, enterprise)")
    plan_category: Literal["free", "paid1", "paid2", "enterprise"] = Field(..., description="Plan category")
    display_name: str = Field(..., description="Display name for the plan")
    description: Optional[str] = Field(None, description="Plan description")
    
    # Limits
    max_bots_per_user: int = Field(..., description="Maximum bots per user")
    max_queries_per_bot_per_day: Optional[int] = Field(None, description="Maximum queries per bot per day (None = unlimited)")
    max_docs_per_bot: int = Field(..., description="Maximum documents per bot")
    max_doc_size_mb: int = Field(..., description="Maximum document size in MB")
    max_urls_per_bot: int = Field(..., description="Maximum URLs per bot")
    max_widget_tokens_per_bot: int = Field(..., description="Maximum widget tokens per bot")
    
    # Feature flags
    train_enabled: bool = Field(..., description="Whether train feature is enabled")
    analytics_tier: Literal["basic", "full"] = Field(..., description="Analytics tier (basic or full)")
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional plan metadata")
    
    # Status
    is_active: bool = Field(default=True, description="Whether the plan is active")
    
    model_config = {"from_attributes": True}


class UserPlanResponseModel(BaseModel):
    """Response model for user's current plan"""
    plan: SubscriptionPlanModel = Field(..., description="Current subscription plan")
    subscription_id: Optional[str] = Field(None, description="Subscription ID")
    status: str = Field(..., description="Subscription status")
    starts_at: Optional[str] = Field(None, description="Subscription start date")
    ends_at: Optional[str] = Field(None, description="Subscription end date")


class PlanResponse(BaseModel):
    """Standard plan response wrapper"""
    status: str = Field(default="success", description="Response status")
    data: UserPlanResponseModel = Field(..., description="User plan data")
    message: Optional[str] = Field(None, description="Response message")

