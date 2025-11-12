import React from "react";
import { ForceDarkMode } from "@/components/landing/force-dark-mode";
import { SectionHeader } from "@/components/landing/section-header";
import CTA from "@/components/landing/sections/cta";
import Features from "@/components/landing/sections/features";
import Footer from "@/components/landing/sections/footer";
import Hero from "@/components/landing/sections/hero";
import Navbar from "@/components/landing/sections/navbar";
import Pricing from "@/components/landing/sections/pricing";
import Stats from "@/components/landing/sections/stats";
import Testimonials from "@/components/landing/sections/testimonials";
import TweetGallery from "@/components/landing/sections/tweet-gallery";
import { ScrollProgress } from "@/components/ui/magicui/scroll-progress";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

export default function LandingPage() {
  return (
    <>
      <ForceDarkMode />
      <div className="min-h-screen relative">
        {/* Solid black background - always dark for branding */}
        <div className="fixed inset-0 bg-background" />

        {/* Content wrapper */}
        <div className="relative z-10">
          <Navbar />
          <ScrollProgress />

          {/* Hero Section */}
          <RevealOnScroll direction="up" delay={200}>
            <Hero />
          </RevealOnScroll>

          {/* Stats Section */}
          <div className="py-20">
            <RevealOnScroll direction="up" delay={200}>
              <Stats />
            </RevealOnScroll>
          </div>

          {/* Features Section */}
          <div id="features" className="py-20 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <RevealOnScroll direction="up" delay={100}>
                <SectionHeader
                  title="Everything you need to build intelligent chatbots"
                  subtitle="Upload content, configure your bot, and embed it on your website. Get insights on user questions and improve your knowledge base."
                />
              </RevealOnScroll>
              <RevealOnScroll direction="up" delay={300}>
                <Features />
              </RevealOnScroll>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="py-20">
            <RevealOnScroll direction="up" delay={200}>
              <Testimonials />
            </RevealOnScroll>
          </div>

          {/* Pricing Section */}
          <div className="py-20">
            <RevealOnScroll direction="up" delay={200}>
              <Pricing />
            </RevealOnScroll>
          </div>

          {/* Use Cases Section */}
          <div className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <RevealOnScroll direction="up" delay={100}>
                <SectionHeader
                  title="Perfect for every organization"
                  subtitle="Universities, companies, knowledge bases, and internal teams use Gulp to provide intelligent assistance."
                />
              </RevealOnScroll>
              {/* Final CTA */}
              <RevealOnScroll direction="up" delay={200}>
                <CTA />
              </RevealOnScroll>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}
