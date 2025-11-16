"use client";

import React from "react";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentsComingSoonPage() {
  const router = useRouter();

  const features = [
    {
      plan: "Starter",
      category: "paid1",
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
      plan: "Growth",
      category: "paid2",
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
      plan: "Enterprise",
      category: "enterprise",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-4 left-4 md:top-8 md:left-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Payments Coming Soon
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re working on integrating payment processing. While we build this feature,
            if you&apos;d like to use paid features now, please reach out to us directly.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Early Access to Paid Features</CardTitle>
            <CardDescription className="text-base">
              Email us at{" "}
              <Link
                href="mailto:info@singlebit.xyz"
                className="text-primary hover:underline font-medium"
              >
                info@singlebit.xyz
              </Link>{" "}
              to request access to paid plans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email CTA */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => window.location.href = "mailto:info@singlebit.xyz?subject=Request%20for%20Paid%20Plan%20Access"}
                className="gap-2"
              >
                <Mail className="h-5 w-5" />
                Email Us for Access
              </Button>
            </div>

            {/* Plan Features */}
            <div className="grid gap-4 md:grid-cols-3 mt-8">
              {features.map((planData) => (
                <Card key={planData.plan} className="relative">
                  <CardHeader>
                    <CardTitle className="text-lg">{planData.plan}</CardTitle>
                    <CardDescription>Available features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {planData.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-center">What to Include in Your Email</h3>
              <ul className="space-y-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                <li>• Which plan you&apos;re interested in (Starter, Growth, or Enterprise)</li>
                <li>• Your use case or how you plan to use the platform</li>
                <li>• Any specific requirements or questions</li>
              </ul>
              <p className="text-center text-sm text-muted-foreground">
                We&apos;ll review your request and get back to you as soon as possible!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          For now, you can continue using the Free plan. All existing features remain available.
        </p>
      </div>
    </div>
  );
}

