import { useQuery } from "@tanstack/react-query";

export interface HealthStatus {
  status: string;
  message: string;
  timestamp?: string;
  responseTime?: number;
}

export interface HealthMetrics {
  uptime: number;
  downtime: number;
  uptimePercentage: number;
  totalChecks: number;
  lastCheck: string;
  averageResponseTime: number;
  status: "healthy" | "degraded" | "down";
}

export interface HealthHistory {
  timestamp: string;
  status: "up" | "down";
  responseTime: number;
}

// Fetch current health status
export const useHealthStatus = () => {
  return useQuery<HealthStatus>({
    queryKey: ["health", "status"],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        // Call backend health endpoint
        // Uses NEXT_PUBLIC_API_BASE_URL if set, otherwise uses relative path (via Next.js rewrite)
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        const data = await response.json();
        const endTime = Date.now();

        return {
          ...data,
          timestamp: new Date().toISOString(),
          responseTime: endTime - startTime,
        };
      } catch (error) {
        throw error;
      }
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Reduce retries for faster failure
  });
};

// Generate mock health metrics (in production, this would come from backend)
export const useHealthMetrics = () => {
  return useQuery<HealthMetrics>({
    queryKey: ["health", "metrics"],
    queryFn: async () => {
      // In production, this would be a real API call
      // For now, we'll generate realistic metrics
      const uptime = 99.87;
      const totalChecks = 8640; // 30 days of 5-min checks
      const downChecks = Math.floor(totalChecks * (1 - uptime / 100));

      return {
        uptime: totalChecks - downChecks,
        downtime: downChecks,
        uptimePercentage: uptime,
        totalChecks,
        lastCheck: new Date().toISOString(),
        averageResponseTime: 145,
        status: uptime >= 99.5 ? "healthy" : uptime >= 95 ? "degraded" : "down",
      };
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Generate health history for charts (last 24 hours)
export const useHealthHistory = () => {
  return useQuery<HealthHistory[]>({
    queryKey: ["health", "history"],
    queryFn: async () => {
      // In production, this would be a real API call
      // Generate last 24 hours of data (15-minute intervals for better performance)
      const history: HealthHistory[] = [];
      const now = Date.now();
      const intervals = 96; // 24 hours / 15 minutes (reduced from 288)

      for (let i = intervals; i >= 0; i--) {
        const timestamp = new Date(now - i * 15 * 60 * 1000); // 15-minute intervals
        const isDown = Math.random() < 0.002; // 0.2% chance of downtime

        history.push({
          timestamp: timestamp.toISOString(),
          status: isDown ? "down" : "up",
          responseTime: isDown ? 0 : Math.floor(100 + Math.random() * 200),
        });
      }

      return history;
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};
