"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextLogo } from "@/components/ui/text-logo";
import { cn } from "@/lib/utils";

export default function Footer({ className }: { className?: string }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={cn(
        "w-full border-t border-primary/20 pt-12 pb-8 bg-background",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <TextLogo showIcon iconSize={32} className="text-xl" />
            </div>
            <p className="text-foreground/80 mb-4 max-w-md">
              Embed intelligent chatbots on your website powered by your own
              documents, URLs, or custom text. No backend code required.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/namanbarkiya/gulp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#features"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/namanbarkiya/gulp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/namanbarkiya/gulp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/namanbarkiya/gulp/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-foreground/60">
            &copy; {new Date().getFullYear()} gulp.
            {/* Built by{" "}
            <a
              href="https://github.com/namanbarkiya/gulp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-primary transition-colors"
            >
              SingleBit.
            </a> */}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-sm transition-colors"
              aria-label="Back to top"
            >
              <ArrowUpIcon className="w-4 h-4" />
              <span>Back to top</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
