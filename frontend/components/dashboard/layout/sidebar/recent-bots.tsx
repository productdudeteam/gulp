"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Bot as BotType } from "@/lib/types/bot";

interface RecentBotsProps {
  bots: BotType[];
}

export function RecentBots({ bots }: RecentBotsProps) {
  const pathname = usePathname();

  if (bots.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      {bots.map((bot) => {
        // Only active if pathname exactly matches or starts with the bot's URL
        // This ensures only one item is selected at a time
        const botUrl = `/dashboard/bots/${bot.id}`;
        const isActive = pathname === botUrl || pathname.startsWith(`${botUrl}/`);
        return (
          <SidebarMenuItem key={bot.id}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={botUrl}>
                <Bot className="size-4" />
                <span className="truncate">{bot.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

