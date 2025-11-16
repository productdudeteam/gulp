"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useBots, useCreateBot } from "@/lib/query/hooks/bots";
import { usePlanFeatures } from "@/lib/query/hooks/plan";
import type { BotCreateInput, LLMProvider } from "@/lib/types/bot";
import {
  extractErrorMessage,
  getErrorTitle,
} from "@/lib/utils/error-extractor";

interface BotCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BotCreateDialog({
  open,
  onOpenChange,
}: BotCreateDialogProps) {
  const router = useRouter();
  const createBot = useCreateBot();
  const { success, error: showError } = useNotifications();
  const { plan, limits, isLoading: planLoading } = usePlanFeatures();
  const { data: bots } = useBots();

  const [formData, setFormData] = useState<BotCreateInput>({
    name: "",
    description: "",
    system_prompt:
      "You are an intelligent assistant. Answer user queries using the provided context. If you're not sure, say \"I'm not sure, but you can check this page: [link].\" Always include citations when referring to a source. Keep tone friendly and professional.",
    llm_provider: "openai",
    llm_config: {
      temperature: 0.7,
      max_tokens: 1000,
      model_name: "gpt-4o",
    },
    retention_days: 90,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Validation Error", "Bot name is required");
      return;
    }

    createBot.mutate(formData, {
      onSuccess: (newBot) => {
        success(
          "Bot Created",
          `"${newBot.name}" has been created successfully`
        );
        onOpenChange(false);
        // Reset form
        setFormData({
          name: "",
          description: "",
          system_prompt:
            "You are an intelligent assistant. Answer user queries using the provided context. If you're not sure, say \"I'm not sure, but you can check this page: [link].\" Always include citations when referring to a source. Keep tone friendly and professional.",
          llm_provider: "openai",
          llm_config: {
            temperature: 0.7,
            max_tokens: 1000,
            model_name: "gpt-4o",
          },
          retention_days: 90,
        });
        // Navigate to the new bot's page
        router.push(`/dashboard/bots/${newBot.id}`);
      },
      onError: (error: unknown) => {
        const errorMessage = extractErrorMessage(error);
        const errorTitle = getErrorTitle(error);
        showError(errorTitle, errorMessage);
        console.error("Create bot error:", error);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Create a new AI assistant bot with custom configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Limit Warning */}
          {!planLoading && plan && limits && bots && (
            <>
              {bots.length >= limits.maxBots && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You&apos;ve reached your bot limit ({limits.maxBots} bot
                    {limits.maxBots !== 1 ? "s" : ""} on the {plan.display_name}{" "}
                    plan).
                    {plan.plan_key === "free" && (
                      <>
                        {" "}
                        Payments are coming soon, but if you&apos;d like to use
                        paid features now, please email us at{" "}
                        <Link
                          href="mailto:info@singlebit.xyz"
                          className="underline font-medium"
                        >
                          info@singlebit.xyz
                        </Link>
                        .
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {bots.length < limits.maxBots && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You have {bots.length} of {limits.maxBots} bot
                    {limits.maxBots !== 1 ? "s" : ""} available on the{" "}
                    {plan.display_name} plan.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">
                Bot Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My AI Assistant"
                required
                minLength={1}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this bot does..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.description || "").length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-system-prompt">
                System Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="create-system-prompt"
                value={formData.system_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, system_prompt: e.target.value })
                }
                placeholder="You are an intelligent assistant..."
                required
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This prompt defines how your bot behaves and responds
              </p>
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">LLM Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="create-llm-provider">LLM Provider</Label>
              <Select
                value={formData.llm_provider}
                onValueChange={(value: LLMProvider) =>
                  setFormData({
                    ...formData,
                    llm_provider: value,
                    llm_config: {
                      ...formData.llm_config,
                      model_name:
                        value === "openai" ? "gpt-4o" : "gemini-1.5-pro",
                    },
                  })
                }
              >
                <SelectTrigger id="create-llm-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-model-name">Model Name</Label>
                <Input
                  id="create-model-name"
                  value={formData.llm_config?.model_name || "gpt-4o"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      llm_config: {
                        ...formData.llm_config,
                        model_name: e.target.value,
                      },
                    })
                  }
                  placeholder={
                    formData.llm_provider === "openai"
                      ? "gpt-4o"
                      : "gemini-1.5-pro"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.llm_provider === "openai"
                    ? "e.g., gpt-4o, gpt-4-turbo, gpt-3.5-turbo"
                    : "e.g., gemini-1.5-pro, gemini-2.5-flash"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-temperature">
                  Temperature: {formData.llm_config?.temperature ?? 0.7}
                </Label>
                <Input
                  id="create-temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.llm_config?.temperature ?? 0.7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      llm_config: {
                        ...formData.llm_config,
                        temperature: parseFloat(e.target.value) || 0.7,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Controls randomness (0.0 = focused, 2.0 = creative)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-max-tokens">Max Tokens</Label>
                <Input
                  id="create-max-tokens"
                  type="number"
                  min="1"
                  max="4000"
                  value={formData.llm_config?.max_tokens ?? 1000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      llm_config: {
                        ...formData.llm_config,
                        max_tokens: parseInt(e.target.value) || 1000,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens in the response
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-retention-days">Retention Days</Label>
                <Input
                  id="create-retention-days"
                  type="number"
                  min="1"
                  max="3650"
                  value={formData.retention_days ?? 90}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retention_days: parseInt(e.target.value) || 90,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How long to keep query logs (1-3650 days)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBot.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createBot.isPending ||
                Boolean(
                  !planLoading &&
                    plan &&
                    limits &&
                    bots &&
                    limits.maxBots !== null &&
                    limits.maxBots > 0 &&
                    bots.length >= limits.maxBots
                )
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {createBot.isPending ? "Creating..." : "Create Bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
