"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Code, Home, LogIn, Moon, Sparkles, User } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Dock, DockIcon } from "@/components/ui/magicui/dock";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { cn } from "@/lib/utils";

export type IconProps = React.HTMLAttributes<SVGElement>;

export default function Navbar() {
  const [, toggleDark] = useDarkMode();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleFeaturesClick = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePricingClick = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="flex items-center justify-center w-full px-6 pt-4">
        {/* Navigation Dock */}
        <Dock
          iconMagnification={60}
          iconDistance={100}
          className="bg-card border border-primary/20 shadow-xl"
        >
          <DockIcon
            title="Back to Top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Home className="size-full text-foreground/70 hover:text-primary" />
          </DockIcon>
          <DockIcon title="Features" onClick={handleFeaturesClick}>
            <Sparkles className="size-full text-foreground/70 hover:text-primary" />
          </DockIcon>
          <DockIcon title="Pricing" onClick={handlePricingClick}>
            <Code className="size-full text-foreground/70 hover:text-primary" />
          </DockIcon>
          <DockIcon
            title={isAuthenticated ? "Dashboard" : "Login"}
            onClick={handleProfileClick}
          >
            {isAuthenticated ? (
              <User className="size-full text-foreground/70 hover:text-primary" />
            ) : (
              <LogIn className="size-full text-foreground/70 hover:text-primary" />
            )}
          </DockIcon>
          <DockIcon title="Toggle Theme">
            <Moon
              className={cn(
                "size-full text-foreground/70 hover:text-primary transition-colors"
              )}
              onClick={toggleDark}
            />
          </DockIcon>
        </Dock>
      </div>
    </div>
  );
}
