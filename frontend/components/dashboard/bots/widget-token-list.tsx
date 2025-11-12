"use client";

import { useState } from "react";
import { Key, Copy, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWidgetTokens, useRevokeWidgetToken } from "@/lib/query/hooks/widget-tokens";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type { WidgetToken } from "@/lib/types/widget-token";
import { formatDistanceToNow } from "date-fns";

interface WidgetTokenListProps {
  botId: string;
}

// Token Item Component
function TokenItem({
  token,
  onRevoke,
  isRevoking,
}: {
  token: WidgetToken;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrefix = () => {
    if (token.token_prefix) {
      navigator.clipboard.writeText(token.token_prefix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = token.expires_at
    ? new Date(token.expires_at) < new Date()
    : false;

  const expiresSoon = token.expires_at
    ? new Date(token.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    : false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">
                {token.name || "Unnamed Token"}
              </CardTitle>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
              {!isExpired && expiresSoon && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                  Expires Soon
                </Badge>
              )}
            </div>
            {token.token_prefix && (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {token.token_prefix}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPrefix}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevoke}
            disabled={isRevoking}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Allowed Domains:
          </div>
          <div className="flex flex-wrap gap-1">
            {token.allowed_domains.map((domain, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {domain}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div>
            {token.expires_at ? (
              <span>
                {isExpired ? "Expired " : "Expires "}
                {formatDistanceToNow(new Date(token.expires_at), {
                  addSuffix: true,
                })}
              </span>
            ) : (
              <span>Never expires</span>
            )}
          </div>
          {token.last_used_at && (
            <div>
              Last used{" "}
              {formatDistanceToNow(new Date(token.last_used_at), {
                addSuffix: true,
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WidgetTokenList({ botId }: WidgetTokenListProps) {
  const { data: tokens, isLoading, error } = useWidgetTokens(botId);
  const revokeToken = useRevokeWidgetToken(botId);
  const { success, error: showError } = useNotifications();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<WidgetToken | null>(null);

  const handleRevokeClick = (token: WidgetToken) => {
    setTokenToRevoke(token);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = () => {
    if (!tokenToRevoke) return;

    revokeToken.mutate(tokenToRevoke.id, {
      onSuccess: () => {
        success(
          "Token Revoked",
          `Token "${tokenToRevoke.name || tokenToRevoke.token_prefix || tokenToRevoke.id}" has been revoked`
        );
        setRevokeDialogOpen(false);
        setTokenToRevoke(null);
      },
      onError: (error: unknown) => {
        showError("Revocation Failed", "Failed to revoke token. Please try again.");
        console.error("Revoke error:", error);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Tokens
          </CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tokens && tokens.length > 0 ? (
        <div className="space-y-4">
          {tokens.map((token) => (
            <TokenItem
              key={token.id}
              token={token}
              onRevoke={() => handleRevokeClick(token)}
              isRevoking={revokeToken.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
            <p className="text-muted-foreground text-center text-sm">
              Create a widget token to embed your bot on websites
            </p>
          </CardContent>
        </Card>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke the token &quot;{tokenToRevoke?.name || tokenToRevoke?.token_prefix || tokenToRevoke?.id}&quot;. 
              The token will immediately stop working for all widget instances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTokenToRevoke(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={revokeToken.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeToken.isPending ? "Revoking..." : "Revoke Token"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

