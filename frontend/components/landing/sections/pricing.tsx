"use client";

import React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InteractiveHoverButton } from "@/components/ui/magicui/interactive-hover-button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free Template",
    price: "$0",
    description: "Perfect for personal projects and learning",
    popular: false,
    features: [
      "Complete Next.js 15 setup",
      "TypeScript configuration",
      "Tailwind CSS styling",
      "Basic authentication",
      "5+ UI components",
      "Community support",
    ],
  },
  {
    name: "Pro License",
    price: "$49",
    description: "For professional projects and commercial use",
    popular: true,
    features: [
      "Everything in Free",
      "Commercial license",
      "Advanced components",
      "Premium templates",
      "Priority support",
      "Lifetime updates",
      "Custom integrations",
      "Team collaboration tools",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams and enterprise applications",
    popular: false,
    features: [
      "Everything in Pro",
      "Custom development",
      "Dedicated support",
      "Training sessions",
      "Code reviews",
      "SLA guarantees",
      "White-label options",
      "Custom integrations",
    ],
  },
];

export default function Pricing() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Choose your plan
          </h2>
          <p className="text-base text-foreground/80 max-w-2xl mx-auto">
            Free to use and open source theme. This is a mock pricing section.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={cn(
                "relative transition-all duration-500",
                "bg-card",
                "shadow-xl",
                "hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02]",
                "flex flex-col h-full",
                plan.popular
                  ? "border-2 border-primary shadow-2xl scale-[1.05] shadow-primary/20 bg-primary/5"
                  : "border border-primary/20 hover:border-primary/40"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary rounded-full blur-sm opacity-75"></div>
                    <div className="relative bg-primary text-primary-foreground px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="whitespace-nowrap">Most Popular</span>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <CardHeader
                className={cn(
                  "text-center relative z-10",
                  plan.popular && "pt-8"
                )}
              >
                <CardTitle className="text-xl font-semibold text-foreground">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm text-foreground/60 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-sm text-foreground/60 ml-1">
                      /one-time
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 relative z-10">
                <div className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                          <CheckIcon className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground/80 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-primary/20">
                  {plan.price === "Custom" ? (
                    <InteractiveHoverButton
                      onClick={() =>
                        window.open("mailto:hello@nbarkiya.xyz", "_blank")
                      }
                      className="w-full"
                    >
                      Contact Sales
                    </InteractiveHoverButton>
                  ) : plan.popular ? (
                    <InteractiveHoverButton
                      onClick={() =>
                        window.open(
                          "https://github.com/namanbarkiya/niya-saas-template",
                          "_blank"
                        )
                      }
                      className="w-full"
                    >
                      Get Started
                    </InteractiveHoverButton>
                  ) : (
                    <InteractiveHoverButton
                      onClick={() =>
                        window.open(
                          "https://github.com/namanbarkiya/niya-saas-template",
                          "_blank"
                        )
                      }
                      className="w-full"
                    >
                      Download Free
                    </InteractiveHoverButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            All plans include access to the complete source code and
            documentation.
          </p>
        </div>
      </div>
    </section>
  );
}
