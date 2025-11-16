// =====================================================
// WIDGET TOKEN REACT QUERY HOOKS
// =====================================================
// React Query hooks for widget token management operations
// =====================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { extractErrorMessage, getErrorTitle } from "@/lib/utils/error-extractor";
import type {
  WidgetToken,
  WidgetTokenCreateInput,
  WidgetTokenCreateResponse,
  WidgetTokenListResponse,
} from "@/lib/types/widget-token";
import { apiDelete, apiGet, apiPost } from "@/lib/utils/api-client";

// =====================================================
// QUERY FUNCTIONS
// =====================================================

const getWidgetTokens = async (botId: string): Promise<WidgetToken[]> => {
  const response = await apiGet<WidgetTokenListResponse>(
    `/api/v1/bots/${botId}/widget-tokens`
  );
  return response.data;
};

const createWidgetToken = async (
  botId: string,
  tokenData: WidgetTokenCreateInput
): Promise<WidgetTokenCreateResponse> => {
  const response = await apiPost<WidgetTokenCreateResponse>(
    `/api/v1/bots/${botId}/widget-tokens`,
    tokenData
  );
  return response;
};

const revokeWidgetToken = async (
  botId: string,
  tokenId: string
): Promise<void> => {
  await apiDelete<void>(`/api/v1/bots/${botId}/widget-tokens/${tokenId}`);
};

// =====================================================
// REACT QUERY HOOKS
// =====================================================

/**
 * Hook to fetch all widget tokens for a bot
 */
export function useWidgetTokens(botId: string) {
  return useQuery<WidgetToken[], Error>({
    queryKey: ["widget-tokens", botId],
    queryFn: () => getWidgetTokens(botId),
    enabled: !!botId, // Only run query if botId is available
  });
}

/**
 * Hook to create a new widget token
 */
export function useCreateWidgetToken(botId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation<WidgetTokenCreateResponse, Error, WidgetTokenCreateInput>({
    mutationFn: (tokenData) => createWidgetToken(botId, tokenData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widget-tokens", botId] }); // Invalidate token list to refetch
      success(
        "Token Created",
        "Widget token created successfully! Save it now - it won't be shown again."
      );
    },
    onError: (err) => {
      const errorMessage = extractErrorMessage(err);
      const errorTitle = getErrorTitle(err);
      error(errorTitle, errorMessage);
    },
  });
}

/**
 * Hook to revoke a widget token
 */
export function useRevokeWidgetToken(botId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation<void, Error, string>({
    mutationFn: (tokenId) => revokeWidgetToken(botId, tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widget-tokens", botId] }); // Invalidate token list to refetch
      success("Token Revoked", "Widget token revoked successfully!");
    },
    onError: (err) => {
      const errorMessage = extractErrorMessage(err);
      const errorTitle = getErrorTitle(err);
      error(errorTitle, errorMessage);
    },
  });
}

