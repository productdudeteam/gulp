"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InteractiveHoverButton } from "@/components/ui/magicui/interactive-hover-button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for personal projects and testing",
    popular: false,
    features: [
      "1 chatbot",
      "20 queries per bot per day",
      "2 documents (5MB each)",
      "1 URL per bot",
      "1 widget token per bot",
      "Basic analytics",
      "OpenAI or Gemini",
    ],
  },
  {
    name: "Starter",
    price: "Coming Soon",
    description: "For growing businesses and teams",
    popular: true,
    features: [
      "5 chatbots",
      "250 queries per bot per day",
      "5 documents (20MB each)",
      "2 URLs per bot",
      "3 widget tokens per bot",
      "Train Mode",
      "Full Analytics",
    ],
  },
  {
    name: "Growth",
    price: "Coming Soon",
    description: "For scaling businesses with higher volume needs",
    popular: false,
    features: [
      "20 chatbots",
      "Unlimited queries",
      "20 documents (30MB each)",
      "6 URLs per bot",
      "10 widget tokens per bot",
      "Train Mode",
      "Full Analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom needs",
    popular: false,
    features: [
      "Custom limits",
      "Unlimited queries",
      "Custom document limits",
      "50 URLs per bot",
      "50 widget tokens per bot",
      "Train Mode",
      "Full Analytics",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

export default function Pricing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = (planName: string) => {
    if (planName === "Free") {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/signup");
      }
    } else {
      // For paid plans, redirect to payments coming soon page
      router.push("/payments-coming-soon");
    }
  };
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-16" id="pricing">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-base text-foreground/80 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  {plan.price === "$0" && (
                    <span className="text-sm text-foreground/60 ml-1">
                      /forever
                    </span>
                  )}
                  {plan.price === "Coming Soon" && (
                    <span className="text-sm text-foreground/60 ml-1 block mt-1">
                      Payments coming soon
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
                        window.open("mailto:info@singlebit.xyz", "_blank")
                      }
                      className="w-full"
                    >
                      Contact Sales
                    </InteractiveHoverButton>
                  ) : plan.price === "Coming Soon" ? (
                    <InteractiveHoverButton
                      onClick={() => handleGetStarted(plan.name)}
                      className="w-full"
                    >
                      Request Access
                    </InteractiveHoverButton>
                  ) : (
                    <InteractiveHoverButton
                      onClick={() => handleGetStarted(plan.name)}
                      className="w-full"
                    >
                      {plan.price === "$0" ? "Get Started Free" : "Start Free Trial"}
                    </InteractiveHoverButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-foreground/60">
            All plans include 24/7 support, secure hosting, and regular updates.
            No credit card required to get started.
          </p>
        </div>
      </div>
    </section>
  );
}
