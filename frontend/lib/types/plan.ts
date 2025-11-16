// =====================================================
// PLAN TYPE DEFINITIONS
// =====================================================
// TypeScript types matching the backend plan models
// =====================================================

export type PlanCategory = "free" | "paid1" | "paid2" | "enterprise";
export type AnalyticsTier = "basic" | "full";

export interface SubscriptionPlan {
  plan_key: string;
  plan_category: PlanCategory;
  display_name: string;
  description?: string | null;
  max_bots_per_user: number;
  max_queries_per_bot_per_day: number | null;
  max_docs_per_bot: number;
  max_doc_size_mb: number;
  max_urls_per_bot: number;
  max_widget_tokens_per_bot: number;
  train_enabled: boolean;
  analytics_tier: AnalyticsTier;
  metadata?: Record<string, any>;
  is_active: boolean;
}

export interface UserPlan {
  plan: SubscriptionPlan;
  subscription_id?: string | null;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface PlanResponse {
  status: "success" | "error";
  data: UserPlan;
  message?: string;
}

