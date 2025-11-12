import React from "react";
import Head from "next/head";

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  structuredData?: object;
}

export function PageSEO({
  title = "Gulp - Embed Intelligent Chatbots on Your Website",
  description = "Embed intelligent chatbots on your website powered by your own documents, PDFs, URLs, or custom text. Train your bot with custom knowledge bases, choose OpenAI or Gemini, and embed with one line of code. No backend required.",
  keywords = [
    "AI chatbot",
    "chatbot builder",
    "document chatbot",
    "PDF chatbot",
    "website chatbot",
    "OpenAI chatbot",
    "Gemini chatbot",
    "knowledge base chatbot",
  ],
  image = "/logo/full-logo-text-white.png",
  url = "https://saas.nbarkiya.xyz",
  type = "website",
  author = "Naman Barkiya",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  structuredData,
}: PageSEOProps) {
  const fullTitle = title.includes("Gulp")
    ? title
    : `${title} | Gulp - AI Assistant Platform`;
  const fullDescription =
    description.length > 160
      ? description.substring(0, 157) + "..."
      : description;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="author" content={author} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Gulp" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@namanbarkiya" />

      {/* Article specific meta tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" &&
        tags.length > 0 &&
        tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#16171B" />
      <meta name="msapplication-TileColor" content="#16171B" />

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://github.com" />
      <link rel="preconnect" href="https://supabase.com" />
    </Head>
  );
}

// Predefined structured data for common pages
export const TemplateStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Gulp",
  description:
    "Embed intelligent chatbots on your website powered by your own documents, PDFs, URLs, or custom text. Train your bot with custom knowledge bases, choose OpenAI or Gemini, and embed with one line of code.",
  url: "https://saas.nbarkiya.xyz",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  author: {
    "@type": "Person",
    name: "Naman Barkiya",
    url: "https://github.com/namanbarkiya/gulp",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  softwareVersion: "1.0.0",
  datePublished: "2025-01-01",
  image: "/logo/full-logo-text-white.png",
};

export const OrganizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gulp",
  url: "https://saas.nbarkiya.xyz",
  logo: "https://saas.nbarkiya.xyz/logo/full-logo-text-white.png",
  sameAs: [
    "https://github.com/namanbarkiya/gulp",
  ],
  founder: {
    "@type": "Person",
    name: "Naman Barkiya",
    url: "https://github.com/namanbarkiya/gulp",
  },
};
