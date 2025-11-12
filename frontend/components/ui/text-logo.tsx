import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TextLogoProps {
  className?: string;
  showIcon?: boolean;
  iconSize?: number;
}

export function TextLogo({
  className,
  showIcon = false,
  iconSize = 20,
}: TextLogoProps) {
  return (
    <span className={cn("font-medium flex items-center gap-2", className)}>
      {showIcon && (
        <Image
          src="/logo/logo-white.svg"
          alt="Gulp Logo"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      )}
      <span className="text-foreground">gulp</span>
      <span className="text-primary -ml-2">.</span>
    </span>
  );
}
