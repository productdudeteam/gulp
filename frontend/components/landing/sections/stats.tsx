"use client";

import React from "react";
import { AnimatedShinyText } from "@/components/ui/magicui/animated-shiny-text";

const stats = [
  {
    value: "5min",
    label: "Setup Time",
    description: "From signup to live chatbot",
  },
  {
    value: "2",
    label: "LLM Providers",
    description: "OpenAI & Gemini support",
  },
  {
    value: "100%",
    label: "No Code",
    description: "Zero backend development",
  },
  {
    value: "24/7",
    label: "Available",
    description: "Always-on intelligent assistant",
  },
];

export default function Stats() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-16">
          <AnimatedShinyText className="text-sm font-normal text-foreground/60 mb-4">
            ✨ Powered by your own knowledge
          </AnimatedShinyText>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Why organizations choose Gulp
          </h2>
          <p className="text-base text-foreground/80 max-w-2xl mx-auto">
            Embed intelligent chatbots on your website in minutes. Train them on
            your documents, get insights on user questions, and provide 24/7
            automated support.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center relative group">
              {/* Background card effect */}
              <div className="absolute inset-0 bg-card rounded-xl border border-primary/20 opacity-0 group-hover:opacity-100 group-hover:border-primary/40 transition-all duration-300" />

              <div className="relative z-10 p-6">
                {/* Number as header */}
                <div className="text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-lg font-semibold text-foreground mb-3 uppercase tracking-wide">
                  {stat.label}
                </div>

                {/* Description */}
                <div className="text-sm text-foreground/60 leading-relaxed">
                  {stat.description}
                </div>
              </div>

              {/* Vertical divider between stats (except last item) */}
              {index < stats.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-px h-20 bg-primary/20 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
