"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/magicui/marquee";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    handle: "University of Technology",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    content:
      "Gulp transformed how we handle student inquiries. We uploaded our course catalogs and policies, and now students get instant answers 24/7.",
    role: "Academic Affairs Director",
  },
  {
    name: "Alex Rodriguez",
    handle: "TechCorp Solutions",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content:
      "Our support team was overwhelmed with FAQs. Gulp reduced ticket volume by 60% by answering common questions automatically using our documentation.",
    role: "Customer Success Manager",
  },
  {
    name: "Maya Patel",
    handle: "KnowledgeBase Inc",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content:
      "We crawled our entire documentation site and embedded Gulp. Users can now search through thousands of articles conversationally.",
    role: "Product Manager",
  },
  {
    name: "Jordan Kim",
    handle: "Internal Tools Team",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content:
      "Gulp helps our team quickly find information from training materials and policy documents. The analytics show us what questions are most common.",
    role: "HR Technology Lead",
  },
  {
    name: "Emma Thompson",
    handle: "E-commerce Platform",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    content:
      "Setup took less than 10 minutes. We uploaded our product guides and return policies, and customers get instant help without waiting for support.",
    role: "Operations Director",
  },
  {
    name: "David Park",
    handle: "Healthcare Network",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content:
      "Gulp handles patient inquiries about appointments, insurance, and services. The security and compliance features give us confidence.",
    role: "IT Director",
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <Card
      className={cn(
        "w-96 h-52 p-6 mx-3",
        "bg-card",
        "border border-primary/20",
        "shadow-lg",
        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:scale-[1.02] transition-all duration-500",
        "relative"
      )}
    >
      <CardContent className="p-0 h-full flex flex-col justify-between relative z-10">
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
          &ldquo;{testimonial.content}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback>
              {testimonial.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm text-foreground">
              {testimonial.name}
            </div>
            <div className="text-xs text-foreground/60">
              {testimonial.role} • {testimonial.handle}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Testimonials() {
  return (
    <section className="overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
          Trusted by organizations worldwide
        </h2>
        <p className="text-base text-foreground/80 max-w-2xl mx-auto">
          See how universities, companies, and teams use Gulp to provide
          intelligent assistance and reduce support workload.
        </p>
      </div>

      <div className="relative w-full">
        <Marquee pauseOnHover className="[--duration:40s]">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </Marquee>

        {/* Gradient shadow overlays for sleek fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

        {/* Additional subtle shadow layers for depth */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background/60 to-transparent z-10 pointer-events-none blur-sm" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background/60 to-transparent z-10 pointer-events-none blur-sm" />
      </div>
    </section>
  );
}
