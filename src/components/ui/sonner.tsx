"use client";

// The toast: a short message that says what an action did. Screens do not call it; they go through
// src/lib/notify.ts, which decides how long it stays, so every result is told the same way.
import type * as React from "react";
import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      // Colours come from the theme's own variables below, in light and dark alike.
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
