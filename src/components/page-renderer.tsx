"use client";

/**
 * Page Renderer Component - FIXED VERSION
 * Renders individual pages (cover, toc, or content) for preview
 *
 * CHANGES:
 * 1. Added TOC page type support
 * 2. Removed title page type (replaced by TOC)
 * 3. Better page number display
 */

import {
  PreviewFormat,
  FORMAT_PRESETS,
  DEVICE_PAGINATION_CONFIGS,
} from "@/lib/device-configs";
import { PreviewPage, BookData } from "@/lib/preview-builder";
import { CoverPage } from "./cover-page";
import { cn } from "@/lib/utils";

interface PageRendererProps {
  page: PreviewPage;
  format: PreviewFormat;
  bookData?: BookData;
  className?: string;
}

export function PageRenderer({
  page,
  format,
  bookData,
  className,
}: PageRendererProps) {
  const preset = FORMAT_PRESETS[format];
  const config = DEVICE_PAGINATION_CONFIGS[format];

  // ─────────────────────────────────────────────────────────────
  // COVER PAGE
  // ─────────────────────────────────────────────────────────────
  if (page.type === "cover" && page.coverData) {
    return (
      <CoverPage
        coverData={page.coverData}
        format={format}
        className={className}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TABLE OF CONTENTS PAGE
  // ─────────────────────────────────────────────────────────────
  if (page.type === "toc") {
    return (
      <div
        className={cn(
          "bg-background border border-border shadow-xl relative overflow-hidden",
          className
        )}
        style={{
          width: `${preset.viewportWidth}px`,
          height: `${preset.pagePixelHeight}px`,
        }}
      >
        <div
          className="h-full overflow-hidden"
          style={{
            padding: `${config.marginTop}px ${config.marginRight}px ${config.marginBottom}px ${config.marginLeft}px`,
            fontSize: `${config.fontSize}px`,
            lineHeight: config.lineHeight,
          }}
        >
          {/* If we have pre-generated TOC HTML, use it */}
          {page.content ? (
            <div
              className="h-full"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : page.tocEntries ? (
            /* Otherwise render from tocEntries */
            <div className="h-full flex flex-col">
              <h2
                className="text-center font-bold border-b pb-4 mb-6"
                style={{ fontSize: `${config.fontSize * 1.5}px` }}
              >
                Índice
              </h2>
              <div className="space-y-3 flex-1">
                {page.tocEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-baseline gap-2",
                      entry.level === 0 && "font-medium italic",
                      entry.level === 1 && "font-semibold"
                    )}
                    style={{
                      paddingLeft: entry.level > 0 ? "0" : "0",
                    }}
                  >
                    <span className="whitespace-nowrap">{entry.title}</span>
                    <span className="flex-1 border-b border-dotted border-muted-foreground/50 min-w-8" />
                    <span className="tabular-nums text-muted-foreground">
                      {entry.pageNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Índice vacío</p>
            </div>
          )}
        </div>

        {/* Page number */}
        {page.pageNumber !== undefined && page.pageNumber > 1 && (
          <div
            className="absolute bottom-3 left-0 right-0 text-center text-muted-foreground"
            style={{ fontSize: `${config.fontSize * 0.75}px` }}
          >
            {page.pageNumber}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CONTENT PAGE
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "bg-background border border-border shadow-xl relative overflow-hidden",
        className
      )}
      style={{
        width: `${preset.viewportWidth}px`,
        height: `${preset.pagePixelHeight}px`,
      }}
    >
      {/* Chapter header (if available) */}
      {page.chapterTitle && (
        <div
          className="absolute top-2 left-0 right-0 text-center text-muted-foreground truncate px-4"
          style={{ fontSize: `${config.fontSize * 0.7}px` }}
        >
          {page.chapterTitle}
        </div>
      )}

      {/* Content area */}
      <div
        className="h-full overflow-hidden"
        style={{
          padding: `${config.marginTop}px ${config.marginRight}px ${config.marginBottom}px ${config.marginLeft}px`,
          paddingTop: page.chapterTitle
            ? `${config.marginTop + 12}px`
            : `${config.marginTop}px`,
          fontSize: `${config.fontSize}px`,
          lineHeight: config.lineHeight,
        }}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none h-full",
            // Responsive prose sizing
            format === "mobile" && "prose-xs",
            format === "ereader" && "prose-sm"
          )}
          style={{
            fontSize: `${config.fontSize}px`,
            lineHeight: config.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>

      {/* Page number footer */}
      {page.pageNumber !== undefined && page.pageNumber > 1 && (
        <div
          className="absolute bottom-3 left-0 right-0 text-center text-muted-foreground"
          style={{ fontSize: `${config.fontSize * 0.75}px` }}
        >
          {page.pageNumber}
        </div>
      )}
    </div>
  );
}
