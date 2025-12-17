"use client";

/**
 * Cover Page Component
 * Renders the book cover with image or color background
 */

import { PreviewFormat, FORMAT_PRESETS } from "@/lib/device-configs";
import { CoverData } from "@/lib/preview-builder";
import { cn } from "@/lib/utils";

interface CoverPageProps {
  coverData: CoverData;
  format: PreviewFormat;
  className?: string;
}

// Layout configurations matching cover-editor.tsx
const layoutConfigs: Record<
  string,
  {
    container: string;
    content: string;
    title: string;
    author: string;
  }
> = {
  centered: {
    container: "justify-center items-center text-center",
    content: "space-y-6 items-center text-center",
    title: "text-center",
    author: "text-center",
  },
  top: {
    container: "justify-start items-start text-left",
    content: "space-y-6 items-start text-left pt-8",
    title: "text-left",
    author: "text-left",
  },
  bottom: {
    container: "justify-end items-end text-right",
    content: "space-y-6 items-end text-right pb-8",
    title: "text-right",
    author: "text-right",
  },
  split: {
    container: "justify-between items-stretch text-left",
    content: "h-full w-full text-left flex flex-col justify-between",
    title: "text-left",
    author: "text-right mt-auto",
  },
};

export function CoverPage({ coverData, format, className }: CoverPageProps) {
  const dimensions = FORMAT_PRESETS[format];
  const layout = coverData.coverLayout || "centered";
  const layoutConfig = layoutConfigs[layout] || layoutConfigs.centered;
  const fontClass = coverData.coverFont || "font-serif";

  return (
    <div
      className={cn(
        "relative flex flex-col bg-cover bg-center shadow-2xl overflow-hidden",
        layoutConfig.container,
        className
      )}
      style={{
        width: `${dimensions.viewportWidth}px`,
        height: `${dimensions.pagePixelHeight}px`,
        backgroundColor: coverData.coverImage
          ? "transparent"
          : coverData.coverColor,
      }}
    >
      {/* Background image if provided */}
      {coverData.coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${coverData.coverImage})`,
          }}
        >
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/50" />
        </div>
      )}

      {/* Cover content */}
      <div className={cn("relative z-10 px-8 py-12 max-w-full", layoutConfig.content, fontClass)}>
        {/* Title */}
        <h1
          className={cn(
            "font-bold text-white drop-shadow-lg leading-tight",
            layoutConfig.title,
            format === "mobile" && "text-2xl",
            format === "ereader" && "text-3xl",
            format === "tablet" && "text-4xl",
            format === "laptop" && "text-5xl"
          )}
          style={{
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {coverData.title}
        </h1>

        {/* Subtitle */}
        {coverData.subtitle && (
          <p
            className={cn(
              "italic text-white/90 drop-shadow-md",
              layoutConfig.title,
              format === "mobile" && "text-sm",
              format === "ereader" && "text-base",
              format === "tablet" && "text-lg",
              format === "laptop" && "text-xl"
            )}
            style={{
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {coverData.subtitle}
          </p>
        )}

        {/* Author */}
        <p
          className={cn(
            "text-white/80 font-medium",
            layoutConfig.author,
            layout === "split" && "mt-auto",
            format === "mobile" && "text-xs",
            format === "ereader" && "text-sm",
            format === "tablet" && "text-base",
            format === "laptop" && "text-lg"
          )}
          style={{
            textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          {coverData.author}
        </p>
      </div>

      {/* Decorative bottom bar */}
      {!coverData.coverImage && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          }}
        />
      )}
    </div>
  );
}
