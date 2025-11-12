"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AnimatedShinyText } from "@/components/ui/magicui/animated-shiny-text";
import { AuroraText } from "@/components/ui/magicui/aurora-text";
import { InteractiveHoverButton } from "@/components/ui/magicui/interactive-hover-button";
import { WordRotate } from "@/components/ui/magicui/word-rotate";
import { cn } from "@/lib/utils";

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <section className="relative flex min-h-screen md:min-h-[90vh] flex-col items-center justify-center px-2 py-8 md:px-4 md:py-24 overflow-hidden">
      {/* Subtle yellow accent orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {" "}
        <div className="z-10 flex items-center justify-center">
          {" "}
          <div
            className={cn(
              "group rounded-full border border-primary/20 bg-primary/10 text-base text-primary-foreground transition-all ease-in hover:cursor-pointer hover:bg-primary/20"
            )}
          >
            {" "}
            <AnimatedShinyText
              className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-primary hover:duration-300"
              onClick={() =>
                window.open("https://github.com/namanbarkiya/gulp", "_blank")
              }
            >
              {" "}
              <span>✨ Intelligent AI Assistant Platform</span>{" "}
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />{" "}
            </AnimatedShinyText>{" "}
          </div>{" "}
        </div>{" "}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-tight leading-tight">
          Embed Intelligent <AuroraText>Chatbots</AuroraText> on Your Website
        </h1>
        <div className="mt-2">
          {" "}
          <WordRotate
            words={[
              "Powered by your own documents, PDFs, and URLs.",
              "Train your bot with custom knowledge bases.",
              "Choose OpenAI or Gemini for intelligent responses.",
              "Get insights on what users are asking.",
              "One-line embed script. No backend code needed.",
            ]}
            className="text-lg text-center md:text-xl text-foreground/80 font-normal min-h-[2rem]"
            duration={2200}
          />{" "}
        </div>{" "}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-fit max-w-lg mx-auto">
          <InteractiveHoverButton onClick={handleAuthButtonClick}>
            {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
          </InteractiveHoverButton>
          <InteractiveHoverButton
            onClick={() =>
              window.open("https://github.com/namanbarkiya/gulp", "_blank")
            }
          >
            View Documentation
          </InteractiveHoverButton>
        </div>
        <div className="mt-6 text-center text-sm text-foreground/60">
          <p>
            Trusted by universities, companies, and knowledge-base sites
            worldwide
          </p>
        </div>
      </div>

      {/* Animated Scroll Down Arrow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <a
          href="#features"
          className="flex flex-col items-center gap-2 text-foreground/60 hover:text-primary transition-colors duration-300 group"
          aria-label="Scroll to features"
        >
          <span className="text-xs font-medium tracking-wider uppercase animate-pulse">
            ...
          </span>
          <ChevronDown className="w-6 h-6 animate-bounce group-hover:translate-y-1 transition-transform duration-300" />
        </a>
      </div>
    </section>
  );
}
