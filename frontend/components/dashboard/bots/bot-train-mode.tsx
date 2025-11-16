"use client";

import { useState, useEffect } from "react";
import { GraduationCap, History, TestTube, Save, RotateCcw, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePromptUpdates, useCreatePromptUpdate, useApplyPromptUpdate, useRevertPrompt, useGeneratePrompt } from "@/lib/query/hooks";
import { usePlanFeatures } from "@/lib/query/hooks/plan";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import type { Bot } from "@/lib/types/bot";
import BotSandboxChat from "./bot-sandbox-chat";
import { Mail } from "lucide-react";
import Link from "next/link";

interface BotTrainModeProps {
  bot: Bot;
}

export default function BotTrainMode({ bot }: BotTrainModeProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "history" | "sandbox">("editor");
  const [feedback, setFeedback] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { success, error: showError } = useNotifications();
  const { trainEnabled, isLoading: planLoading } = usePlanFeatures();
  const { data: updates, isLoading: updatesLoading } = usePromptUpdates(bot.id, 50);
  const generatePrompt = useGeneratePrompt(bot.id);
  const createUpdate = useCreatePromptUpdate(bot.id);
  const applyUpdate = useApplyPromptUpdate(bot.id);
  const revertPrompt = useRevertPrompt(bot.id);

  // Update generated prompt when bot changes
  useEffect(() => {
    setGeneratedPrompt(null);
    setFeedback("");
  }, [bot.id]);

  const handleGenerate = async () => {
    if (!feedback.trim()) {
      showError("Validation Error", "Please provide feedback about what needs to be updated");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generatePrompt.mutateAsync({ feedback: feedback.trim() });
      setGeneratedPrompt(result.updated_prompt);
      success("Prompt Generated", "The updated prompt has been generated. Review it and click 'Apply Changes' to save.");
    } catch (err) {
      showError("Generation Failed", "Failed to generate updated prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!generatedPrompt) {
      showError("No Prompt", "Please generate a prompt first");
      return;
    }

    if (generatedPrompt === bot.system_prompt) {
      showError("No Changes", "The generated prompt is the same as the current prompt");
      return;
    }

    try {
      await createUpdate.mutateAsync({
        new_prompt: generatedPrompt,
        reason: feedback.trim() || undefined,
        auto_apply: true, // Auto-apply when user clicks "Apply Changes"
      });

      success("Prompt Applied", "The updated prompt has been applied to your bot");
      setGeneratedPrompt(null);
      setFeedback("");
    } catch (err) {
      showError("Failed", "Failed to apply prompt update");
    }
  };

  const handleTestUpdate = async () => {
    if (!generatedPrompt) {
      showError("No Prompt", "Please generate a prompt first");
      return;
    }

    // Switch to sandbox tab - the sandbox chat will use the generatedPrompt
    setActiveTab("sandbox");
  };

  const handleApply = async (updateId: string) => {
    try {
      await applyUpdate.mutateAsync(updateId);
      success("Prompt Applied", "The prompt update has been applied to your bot");
    } catch (err) {
      showError("Failed", "Failed to apply prompt update");
    }
  };

  const handleRevert = async (updateId: string) => {
    try {
      await revertPrompt.mutateAsync(updateId);
      success("Prompt Reverted", "The bot has been reverted to the previous prompt version");
    } catch (err) {
      showError("Failed", "Failed to revert prompt");
    }
  };

  // Show upgrade message if train feature is not enabled
  if (!planLoading && !trainEnabled) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Train Mode</CardTitle>
            </div>
            <CardDescription>
              Train Mode is only available on paid plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 border border-primary/20 rounded-lg bg-muted/50 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Train Mode allows you to improve your bot&apos;s system prompt using AI feedback.
                This feature is available on Starter, Growth, and Enterprise plans.
              </p>
              <p className="text-sm text-muted-foreground">
                Payments are coming soon, but if you&apos;d like to use paid features now,
                please email us at{" "}
                <Link
                  href="mailto:info@singlebit.xyz"
                  className="text-primary hover:underline font-medium"
                >
                  info@singlebit.xyz
                </Link>
                .
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Link href="/payments-coming-soon">
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Train Mode</CardTitle>
          </div>
          <CardDescription>
            Provide feedback to improve your bot&apos;s system prompt using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">
                <TestTube className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="sandbox">
                <TestTube className="h-4 w-4 mr-2" />
                Sandbox
              </TabsTrigger>
            </TabsList>

            {/* Prompt Editor Tab */}
            <TabsContent value="editor" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">What needs to be updated?</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., Make the responses more friendly and conversational, add instructions to always cite sources, improve the tone to be more professional..."
                  rows={4}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what improvements you want in the system prompt
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!feedback.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Updated Prompt
                  </>
                )}
              </Button>

              {generatedPrompt && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Generated System Prompt</Label>
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {generatedPrompt}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {generatedPrompt.length} characters
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApplyChanges}
                      disabled={createUpdate.isPending || generatedPrompt === bot.system_prompt}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {createUpdate.isPending ? "Applying..." : "Apply Changes"}
                    </Button>
                    <Button
                      onClick={handleTestUpdate}
                      variant="outline"
                      className="flex-1"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Update
                    </Button>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> Click &quot;Apply Changes&quot; to save this prompt to your bot.
                      Click &quot;Test Update&quot; to test it in the sandbox without saving.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {!generatedPrompt && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Enter feedback above and click &quot;Generate Updated Prompt&quot; to see AI-generated improvements.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              {updatesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading history...
                </div>
              ) : !updates || updates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No prompt updates yet. Create your first update in the Editor tab.
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {updates.map((update, idx) => (
                      <Card key={update.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">
                                  Update #{updates.length - idx}
                                </CardTitle>
                                {update.auto_applied && (
                                  <Badge variant="default" className="text-xs">
                                    Auto-applied
                                  </Badge>
                                )}
                                {update.new_prompt === bot.system_prompt && (
                                  <Badge variant="secondary" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-xs">
                                {formatDistanceToNow(new Date(update.created_at), {
                                  addSuffix: true,
                                })}
                              </CardDescription>
                              {update.reason && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {update.reason}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {update.new_prompt !== bot.system_prompt && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApply(update.id)}
                                  disabled={applyUpdate.isPending}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Apply
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevert(update.id)}
                                disabled={revertPrompt.isPending}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Revert
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Old Prompt</Label>
                            <div className="mt-1 p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                              {update.old_prompt}
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <Label className="text-xs text-muted-foreground">New Prompt</Label>
                            <div className="mt-1 p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                              {update.new_prompt}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Sandbox Tab */}
            <TabsContent value="sandbox" className="mt-4">
              <BotSandboxChat 
                bot={bot} 
                customPrompt={generatedPrompt || bot.system_prompt} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
