// =====================================================
// PLAN REACT QUERY HOOKS
// =====================================================
// React Query hooks for subscription plan operations
// =====================================================
import { useQuery } from "@tanstack/react-query";
import type { UserPlan, PlanResponse } from "@/lib/types/plan";
import { apiGet } from "@/lib/utils/api-client";
import { queryKeys } from "../client";

// =====================================================
// PLAN QUERY KEYS
// =====================================================

export const planQueryKeys = {
  all: queryKeys.plan.all,
  userPlan: queryKeys.plan.userPlan,
} as const;

// =====================================================
// PLAN FETCH FUNCTIONS
// =====================================================

/**
 * Fetch current user's subscription plan
 */
async function getUserPlan(): Promise<UserPlan> {
  const response = await apiGet<PlanResponse>("/api/v1/user/plan");
  return response.data;
}

// =====================================================
// PLAN QUERY HOOKS
// =====================================================

/**
 * Hook to get the current user's subscription plan
 */
export function useUserPlan() {
  return useQuery({
    queryKey: planQueryKeys.userPlan(),
    queryFn: getUserPlan,
    staleTime: 5 * 60 * 1000, // 5 minutes - plan doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once if it fails
  });
}

// =====================================================
// PLAN UTILITY HOOKS
// =====================================================

/**
 * Hook to check plan features and limits
 */
export function usePlanFeatures() {
  const { data: userPlan, isLoading } = useUserPlan();

  const plan = userPlan?.plan;

  return {
    plan,
    isLoading,
    isFree: plan?.plan_key === "free",
    isStarter: plan?.plan_key === "starter",
    isGrowth: plan?.plan_key === "growth",
    isEnterprise: plan?.plan_key === "enterprise",
    trainEnabled: plan?.train_enabled ?? false,
    analyticsTier: plan?.analytics_tier ?? "basic",
    hasFullAnalytics: plan?.analytics_tier === "full",
    limits: plan
      ? {
          maxBots: plan.max_bots_per_user,
          maxQueriesPerDay: plan.max_queries_per_bot_per_day,
          maxDocs: plan.max_docs_per_bot,
          maxDocSizeMB: plan.max_doc_size_mb,
          maxUrls: plan.max_urls_per_bot,
          maxWidgetTokens: plan.max_widget_tokens_per_bot,
        }
      : null,
  };
}

