import { useQuery } from "@tanstack/react-query";
import type { ChunkListResponse } from "@/lib/types/chunk";
import { apiGet } from "@/lib/utils/api-client";

export const chunkKeys = {
  all: ["chunks"] as const,
  bySource: (botId: string, sourceId: string) =>
    [...chunkKeys.all, "bySource", botId, sourceId] as const,
  byBot: (botId: string) => [...chunkKeys.all, "byBot", botId] as const,
};

export function useChunksBySource(
  botId: string | undefined,
  sourceId: string | undefined,
  enabled: boolean = true
) {
  const isEnabled = Boolean(botId && sourceId && enabled);
  return useQuery({
    queryKey:
      isEnabled && botId && sourceId
        ? chunkKeys.bySource(botId, sourceId)
        : chunkKeys.all,
    queryFn: async () => {
      if (!botId || !sourceId)
        return {
          status: "success",
          data: [],
          message: "",
        } as ChunkListResponse;
      const res = await apiGet<ChunkListResponse>(
        `/api/v1/bots/${botId}/sources/${sourceId}/chunks`
      );
      return res;
    },
    enabled: isEnabled,
  });
}
