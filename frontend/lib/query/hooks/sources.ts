// =====================================================
// SOURCE REACT QUERY HOOKS
// =====================================================
// React Query hooks for source management operations
// =====================================================
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { extractErrorMessage, getErrorTitle } from "@/lib/utils/error-extractor";
import type {
  Source,
  SourceCreateInput,
  SourceListResponse,
  SourceResponse,
} from "@/lib/types/source";
import { apiDelete, apiGet, apiPost } from "@/lib/utils/api-client";

// =====================================================
// QUERY FUNCTIONS
// =====================================================

const getSources = async (botId: string): Promise<Source[]> => {
  const response = await apiGet<SourceListResponse>(
    `/api/v1/bots/${botId}/sources`
  );
  return response.data;
};

const getSource = async (botId: string, sourceId: string): Promise<Source> => {
  const response = await apiGet<SourceResponse>(
    `/api/v1/bots/${botId}/sources/${sourceId}`
  );
  return response.data;
};

const uploadFileSource = async (botId: string, file: File): Promise<Source> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/v1/bots/${botId}/sources/upload`, {
    method: "POST",
    body: formData,
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status} error`,
    }));
    throw new Error(error.detail || error.message || "Failed to upload file");
  }

  const data: SourceResponse = await response.json();
  return data.data;
};

const createUrlSource = async (
  botId: string,
  sourceData: SourceCreateInput
): Promise<Source> => {
  const response = await apiPost<SourceResponse>(
    `/api/v1/bots/${botId}/sources/url`,
    sourceData
  );
  return response.data;
};

const deleteSource = async (botId: string, sourceId: string): Promise<void> => {
  await apiDelete<void>(`/api/v1/bots/${botId}/sources/${sourceId}`);
};

// =====================================================
// REACT QUERY HOOKS
// =====================================================

/**
 * Hook to fetch all sources for a bot with automatic polling for active parsing
 */
export function useSources(botId: string) {
  const { success, error: showError } = useNotifications();
  const previousDataRef = useRef<Source[] | undefined>(undefined);

  const query = useQuery<Source[], Error>({
    queryKey: ["sources", botId],
    queryFn: () => getSources(botId),
    enabled: !!botId, // Only run query if botId is available
    refetchInterval: (query) => {
      // Poll every 2 seconds if there are sources with "parsing" or "uploaded" status
      const data = query.state.data;
      if (data && Array.isArray(data)) {
        const hasActiveSources = data.some(
          (source) =>
            source.status === "parsing" || source.status === "uploaded"
        );

        if (hasActiveSources) {
          return 2000; // Poll every 2 seconds
        }
      }
      return false; // Stop polling when no active sources
    },
  });

  // Track status changes and show notifications
  useEffect(() => {
    const currentData = query.data;
    const previousData = previousDataRef.current;

    if (previousData && currentData && Array.isArray(currentData)) {
      currentData.forEach((currentSource) => {
        const previousSource = previousData.find(
          (s) => s.id === currentSource.id
        );

        if (previousSource) {
          // Status changed from parsing/uploaded to indexed
          if (
            (previousSource.status === "parsing" ||
              previousSource.status === "uploaded") &&
            currentSource.status === "indexed"
          ) {
            const displayName =
              currentSource.source_type === "html"
                ? currentSource.original_url ||
                  currentSource.canonical_url ||
                  "URL"
                : currentSource.storage_path.split("/").pop() || "File";
            success(
              "Parsing Complete",
              `"${displayName}" has been successfully parsed and indexed.`
            );
          }

          // Status changed to failed
          if (
            previousSource.status !== "failed" &&
            currentSource.status === "failed"
          ) {
            const displayName =
              currentSource.source_type === "html"
                ? currentSource.original_url ||
                  currentSource.canonical_url ||
                  "URL"
                : currentSource.storage_path.split("/").pop() || "File";
            showError(
              "Parsing Failed",
              currentSource.error_message ||
                `Failed to parse "${displayName}". Please check the file and try again.`
            );
          }
        }
      });
    }

    // Update ref for next comparison
    if (currentData) {
      previousDataRef.current = currentData;
    }
  }, [query.data, success, showError]);

  return query;
}

/**
 * Hook to fetch a single source by ID
 */
export function useSource(botId: string, sourceId: string) {
  return useQuery<Source, Error>({
    queryKey: ["sources", botId, sourceId],
    queryFn: () => getSource(botId, sourceId),
    enabled: !!botId && !!sourceId,
  });
}

/**
 * Hook to upload a file source
 */
export function useUploadFileSource(botId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation<Source, Error, File>({
    mutationFn: (file) => uploadFileSource(botId, file),
    onSuccess: (newSource) => {
      queryClient.invalidateQueries({ queryKey: ["sources", botId] }); // Invalidate source list to refetch
      queryClient.setQueryData(["sources", botId, newSource.id], newSource); // Add new source to cache
      success(
        "File Uploaded",
        `"${newSource.storage_path.split("/").pop()}" uploaded successfully!`
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
 * Hook to create a URL source
 */
export function useCreateUrlSource(botId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation<Source, Error, SourceCreateInput>({
    mutationFn: (sourceData) => createUrlSource(botId, sourceData),
    onSuccess: (newSource) => {
      queryClient.invalidateQueries({ queryKey: ["sources", botId] }); // Invalidate source list to refetch
      queryClient.setQueryData(["sources", botId, newSource.id], newSource); // Add new source to cache
      success(
        "URL Added",
        `URL "${newSource.original_url}" added successfully!`
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
 * Hook to delete a source
 */
export function useDeleteSource(botId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation<void, Error, string>({
    mutationFn: (sourceId) => deleteSource(botId, sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources", botId] }); // Invalidate source list to refetch
      success("Source Deleted", "Source deleted successfully!");
    },
    onError: (err) => {
      const errorMessage = extractErrorMessage(err);
      const errorTitle = getErrorTitle(err);
      error(errorTitle, errorMessage);
    },
  });
}
