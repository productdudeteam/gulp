"use client";

import React, { forwardRef, useRef } from "react";
import Image from "next/image";
import { FileText, Files, Link, User, Users } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/magicui/animated-beam";
import { cn } from "@/lib/utils";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-card p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:shadow-[0_0_20px_-12px_rgba(255,255,255,0.1)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamDemo({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-h-[200px] max-w-lg flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <Files className="text-foreground" />
          </Circle>
          <Circle ref={div5Ref}>
            <User className="text-foreground" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Link className="text-foreground" />
          </Circle>
          <Circle ref={div4Ref} className="size-16">
            <Image
              src={"/logo/logo-white.svg"}
              height={100}
              width={100}
              alt="logo"
              className="dark:invert-0"
            />
          </Circle>
          <Circle ref={div6Ref}>
            <Users className="text-foreground" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref}>
            <FileText className="text-foreground" />
          </Circle>
          <Circle ref={div7Ref}>
            <User className="text-foreground" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  );
}
