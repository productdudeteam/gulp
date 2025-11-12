"use client";

import { useState } from "react";
import { Key, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WidgetTokenList from "./widget-token-list";
import WidgetTokenCreateDialog from "./widget-token-create-dialog";

interface BotWidgetManagementProps {
  botId: string;
}

export default function BotWidgetManagement({
  botId,
}: BotWidgetManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Widget Tokens</CardTitle>
              </div>
              <CardDescription>
                Generate and manage tokens to embed your bot widget on websites. Each token can be restricted to specific domains.
              </CardDescription>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Create Token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <WidgetTokenList botId={botId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Widget Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Create a Token</strong>
            </p>
            <p className="text-muted-foreground">
              Click &quot;Create Token&quot; and specify the domains where your widget can be used. You can optionally set an expiration date.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>2. Save the Token Securely</strong>
            </p>
            <p className="text-muted-foreground">
              The token is shown only once during creation. Copy it immediately and store it securely (environment variables, password manager, etc.).
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>3. Embed in Your Website</strong>
            </p>
            <p className="text-muted-foreground">
              Add the token to your widget script to authenticate requests from your website. The widget will automatically validate the token and origin.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>4. Manage Tokens</strong>
            </p>
            <p className="text-muted-foreground">
              You can view all tokens, see when they were last used, and revoke them at any time. Revoked tokens immediately stop working.
            </p>
          </div>
        </CardContent>
      </Card>

      <WidgetTokenCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        botId={botId}
      />
    </div>
  );
}

