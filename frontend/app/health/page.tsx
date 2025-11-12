"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Server,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageSEO } from "@/components/seo/page-seo";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHealthHistory,
  useHealthMetrics,
  useHealthStatus,
} from "@/lib/query/hooks/health";

// Hardcoded primary color
const PRIMARY_COLOR = "#F7CE45";
const SUCCESS_COLOR = "#F7CE45";
const ERROR_COLOR = "#ef4444";

export default function HealthPage() {
  const { data: status, isLoading: statusLoading } = useHealthStatus();
  const { data: metrics, isLoading: metricsLoading } = useHealthMetrics();
  const { data: history, isLoading: historyLoading } = useHealthHistory();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate uptime percentage for last 24h
  const last24hUptime = history
    ? (
        (history.filter((h) => h.status === "up").length / history.length) *
        100
      ).toFixed(2)
    : "0";

  // Prepare chart data
  const responseTimeData = history
    ? history
        .filter((_, i) => i % 12 === 0) // Show every hour
        .map((h) => ({
          time: new Date(h.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          responseTime: h.responseTime,
          status: h.status === "up" ? 1 : 0,
        }))
    : [];

  const statusData = history
    ? history.reduce(
        (acc, h) => {
          if (h.status === "up") acc.up++;
          else acc.down++;
          return acc;
        },
        { up: 0, down: 0 }
      )
    : { up: 0, down: 0 };

  const getStatusBadge = (statusStr?: string) => {
    if (!statusStr) return null;

    const statusMap = {
      healthy: {
        variant: "default" as const,
        className: "bg-green-500/10 text-green-700 dark:text-green-400",
        icon: CheckCircle2,
      },
      degraded: {
        variant: "secondary" as const,
        className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        icon: AlertCircle,
      },
      down: {
        variant: "destructive" as const,
        className: "",
        icon: AlertCircle,
      },
    };

    const config =
      statusMap[statusStr as keyof typeof statusMap] || statusMap.healthy;
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`${config.className} flex items-center gap-1.5`}
      >
        <Icon className="h-3 w-3" />
        {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <PageSEO
        title="System Health Status"
        description="Monitor Gulp system health, uptime, and performance metrics in real-time."
      />

      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              System Health (Mock)
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring and status updates
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-lg font-mono font-semibold">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Current Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Status
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  {getStatusBadge(metrics?.status)}
                  <p className="text-xs text-muted-foreground mt-2">
                    {status?.message || "API is operational"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Uptime Percentage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Uptime (30d)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {metrics?.uptimePercentage.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.uptime.toLocaleString()} /{" "}
                    {metrics?.totalChecks.toLocaleString()} checks
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {status?.responseTime || metrics?.averageResponseTime}ms
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days average
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 24h Uptime */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {last24hUptime}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last checked:{" "}
                    {new Date(metrics?.lastCheck || "").toLocaleTimeString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time (Last 24 Hours)</CardTitle>
            <CardDescription>
              Average API response time measured every 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={responseTimeData}>
                  <defs>
                    <linearGradient
                      id="colorResponse"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={PRIMARY_COLOR}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={PRIMARY_COLOR}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    label={{ value: "ms", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResponse)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution & Detailed Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution (24h)</CardTitle>
              <CardDescription>
                Uptime vs downtime in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { name: "Up", value: statusData.up },
                      { name: "Down", value: statusData.down },
                    ]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { name: "Up", value: statusData.up },
                        { name: "Down", value: statusData.down },
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? SUCCESS_COLOR : ERROR_COLOR}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Backend server details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metricsLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">Total Health Checks</p>
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {metrics?.totalChecks.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">Successful Checks</p>
                      <p className="text-xs text-muted-foreground">
                        Uptime count
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {metrics?.uptime.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">Failed Checks</p>
                      <p className="text-xs text-muted-foreground">
                        Downtime count
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {metrics?.downtime.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Status Timeline (Last 6 Hours)</CardTitle>
            <CardDescription>
              Visual representation of system availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={responseTimeData.slice(-72)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      value === 1 ? "Up" : "Down",
                      "Status",
                    ]}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="status"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
