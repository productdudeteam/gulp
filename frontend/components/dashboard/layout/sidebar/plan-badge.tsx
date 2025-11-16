"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Info, Rocket, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePlanFeatures } from "@/lib/query/hooks/plan";

export function PlanBadge() {
  const { plan, limits, isLoading } = usePlanFeatures();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get sidebar state - useSidebar throws if not in context, so we need to handle it differently
  // Since this component is only used within SidebarProvider, we can safely call useSidebar
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isLoading || !plan || !plan.plan_key) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          {isCollapsed ? (
            <SidebarMenuButton size="lg" disabled>
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </SidebarMenuButton>
          ) : (
            <div className="px-2 py-2">
              <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
            </div>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const planIcon =
    {
      free: Info,
      starter: Zap,
      growth: Rocket,
      enterprise: Crown,
    }[plan.plan_key] || Info;

  const planColor: "secondary" | "default" | "outline" | "destructive" =
    ({
      free: "secondary",
      starter: "default",
      growth: "default",
      enterprise: "default",
    }[plan.plan_key] as "secondary" | "default" | "outline" | "destructive") ||
    "secondary";

  const Icon = planIcon;

  // Ensure display_name exists
  const displayName = plan.display_name || plan.plan_key || "Plan";

  // Collapsed state: Show icon button with tooltip
  if (isCollapsed) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              tooltip={
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3" />
                  <span>{displayName} Plan</span>
                </div>
              }
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only group-data-[collapsible=icon]:hidden">
                {displayName} Plan
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Shared Dialog for both states */}
        <PlanDetailsDialog
          plan={plan}
          limits={limits}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          Icon={Icon}
        />
      </>
    );
  }

  // Expanded state: Show badge with text
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-2">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant={planColor}
                className="flex-1 justify-center gap-1.5 px-2 py-1.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsDialogOpen(true)}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span className="truncate">{displayName}</span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => setIsDialogOpen(true)}
                title="View plan limitations"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Shared Dialog for both states */}
      <PlanDetailsDialog
        plan={plan}
        limits={limits}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        Icon={Icon}
      />
    </>
  );
}

// Separate component for the dialog to avoid duplication
function PlanDetailsDialog({
  plan,
  limits,
  isOpen,
  onOpenChange,
  Icon,
}: {
  plan: NonNullable<ReturnType<typeof usePlanFeatures>["plan"]>;
  limits: ReturnType<typeof usePlanFeatures>["limits"];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {plan.display_name || plan.plan_key || "Plan"} Plan
          </DialogTitle>
          <DialogDescription>
            {plan.description ||
              "Your current subscription plan details and limitations"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Limits Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Plan Limits</h3>
            <div className="grid gap-3">
              {/* Bots Limit */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">Bots</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum chatbots you can create
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {limits?.maxBots ?? "Unlimited"}
                  </p>
                </div>
              </div>

              {/* Queries Limit */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">Daily Queries</p>
                  <p className="text-xs text-muted-foreground">
                    Per bot per day
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {limits?.maxQueriesPerDay ?? "Unlimited"}
                  </p>
                </div>
              </div>

              {/* Documents Limit */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum documents per bot
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {limits?.maxDocs ?? "Unlimited"}
                  </p>
                </div>
              </div>

              {/* Document Size Limit */}
              {limits?.maxDocSizeMB && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document Size</p>
                    <p className="text-xs text-muted-foreground">
                      Maximum size per document
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {limits.maxDocSizeMB} MB
                    </p>
                  </div>
                </div>
              )}

              {/* URLs Limit */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">URLs</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum URLs per bot
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {limits?.maxUrls ?? "Unlimited"}
                  </p>
                </div>
              </div>

              {/* Widget Tokens Limit */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">Widget Tokens</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens per bot
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {limits?.maxWidgetTokens ?? "Unlimited"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Features</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg border">
                <div
                  className={`h-2 w-2 rounded-full ${plan.train_enabled ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-sm">Train Mode</span>
                {!plan.train_enabled && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Not available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border">
                <div
                  className={`h-2 w-2 rounded-full ${plan.analytics_tier === "full" ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-sm">Full Analytics</span>
                {plan.analytics_tier !== "full" && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Basic only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          {plan.plan_key === "free" && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-center mb-3">
                Want to unlock more features and higher limits?
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/payments-coming-soon" passHref>
                  <Button className="w-full" size="sm">
                    View Plans
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground">
                  Or email us at{" "}
                  <Link
                    href="mailto:info@singlebit.xyz"
                    className="text-primary hover:underline"
                  >
                    info@singlebit.xyz
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
