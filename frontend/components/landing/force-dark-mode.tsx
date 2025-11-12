"use client";

import { useEffect } from "react";

export function ForceDarkMode() {
  useEffect(() => {
    // Force dark mode for landing page branding
    document.documentElement.classList.add("dark");
    
    return () => {
      // Don't remove on unmount - let user preference take over when navigating away
    };
  }, []);

  return null;
}

