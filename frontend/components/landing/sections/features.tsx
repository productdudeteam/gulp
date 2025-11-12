import {
  BarChart3,
  Bot,
  FileText,
  Globe,
  Settings,
  Upload,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { BentoCard, BentoGrid } from "@/components/ui/magicui/bento-grid";
import { Marquee } from "@/components/ui/magicui/marquee";
import { cn } from "@/lib/utils";
import { AnimatedBeamDemo } from "./animated-beam-demo";
import AnimatedListDemo from "./animated-list-demo";

const supportedFormats = [
  {
    name: "PDF Documents",
    body: "Upload PDF files and extract text for training your bot.",
  },
  {
    name: "DOCX Files",
    body: "Support for Microsoft Word documents and rich text.",
  },
  {
    name: "Website URLs",
    body: "Crawl and index entire websites or specific pages.",
  },
  {
    name: "Plain Text",
    body: "Direct text input for custom knowledge bases.",
  },
  {
    name: "HTML Pages",
    body: "Parse and extract content from web pages automatically.",
  },
  {
    name: "Multiple Sources",
    body: "Combine documents, URLs, and text in one knowledge base.",
  },
];

const features = [
  {
    Icon: Upload,
    name: "Upload & Index Content",
    description:
      "Upload PDFs, DOCX files, or add website URLs. Gulp automatically extracts, chunks, and indexes your content for intelligent retrieval.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] "
      >
        {supportedFormats.map((format, idx) => (
          <figure
            key={idx}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-primary/20 bg-card hover:bg-primary/10 hover:border-primary/40",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium text-foreground">
                  {format.name}
                </figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs text-foreground/60">
              {format.body}
            </blockquote>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: Bot,
    name: "Configure Your Bot",
    description:
      "Create and customize your AI assistant. Set system prompts, choose between OpenAI or Gemini, and configure temperature and token limits.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedListDemo className="absolute right-2 top-4 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90" />
    ),
  },
  {
    Icon: Globe,
    name: "One-Line Embed",
    description:
      "Copy a simple embed script and add it to your website. The chat widget automatically initializes and connects to your trained bot.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedBeamDemo className="absolute inset-x-2 top-4 h-[300px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: BarChart3,
    name: "Analytics & Insights",
    description:
      "Track query volume, popular questions, unanswered queries, and get insights on what users are asking. Export data as CSV for analysis.",
    className: "col-span-3 lg:col-span-1",
    href: "#",
    cta: "View Analytics",
    background: (
      <Calendar
        mode="single"
        selected={new Date(2022, 4, 11, 0, 0, 0)}
        className="absolute right-0 top-10 origin-top scale-75 rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-90"
      />
    ),
  },
];

export default function Features() {
  return (
    <section id="features">
      <BentoGrid className="gap-6">
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
