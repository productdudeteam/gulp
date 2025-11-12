"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { InteractiveHoverButton } from "@/components/ui/magicui/interactive-hover-button";

export default function CTA() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleGitHub = () => {
    window.open("https://github.com/namanbarkiya/niya-saas-template", "_blank");
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-left">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-4 backdrop-blur-sm">
                ✨ Ready to add AI to your website?
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Start building your{" "}
                <span className="text-primary">intelligent chatbot</span> today
              </h2>

              <p className="text-lg text-foreground/80 mb-8 leading-relaxed">
                Upload your documents, configure your bot, and embed it on your
                website in minutes. No backend code required. Get insights on
                what users are asking.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-primary" />
                  </div>
                  <span>Upload PDFs, DOCX, or crawl website URLs</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-primary" />
                  </div>
                  <span>Choose OpenAI or Gemini for intelligent responses</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-primary" />
                  </div>
                  <span>One-line embed script. Analytics included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - CTA Card */}
          <div className="bg-card border border-primary/20 rounded-2xl p-8 shadow-xl hover:border-primary/40 hover:scale-[1.02] transition-all duration-500 relative">
            <div className="text-center relative z-10">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Start building today
              </h3>
              <p className="text-foreground/60 mb-6">
                Choose your preferred way to get started
              </p>

              <div className="space-y-3">
                <InteractiveHoverButton onClick={handleGetStarted}>
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                </InteractiveHoverButton>

                <InteractiveHoverButton onClick={handleGitHub}>
                  View Source Code
                </InteractiveHoverButton>
              </div>

              <div className="mt-6 text-sm text-foreground/60">
                <p>
                  Free to get started • Secure & compliant • No credit card
                  required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
