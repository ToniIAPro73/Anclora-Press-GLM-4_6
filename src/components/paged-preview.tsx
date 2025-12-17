"use client"

/**
 * PagedPreview Component
 * WYSIWYG preview using Paged.js for perfect fidelity
 * What you see is EXACTLY what you'll print/export
 */

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Download, Monitor, Tablet, Smartphone, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { isPageBreakMarker, replacePageBreakMarkers } from "@/lib/page-breaks"

const PAGE_BREAK_ELEMENT = '<div class="page-break" aria-hidden="true"></div>'

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i

function looksLikeHtml(value: string): boolean {
  return HTML_PATTERN.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function convertMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const htmlParts: string[] = []
  let paragraphBuffer: string[] = []
  let listType: "ul" | "ol" | null = null
  let previousLineBlank = true

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      htmlParts.push(`<p>${escapeHtml(paragraphBuffer.join(" ").trim())}</p>`)
      paragraphBuffer = []
    }
  }

  const closeList = () => {
    if (listType) {
      htmlParts.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim()

    if (!trimmedLine.length) {
      flushParagraph()
      closeList()
      previousLineBlank = true
      continue
    }

    if (isPageBreakMarker(trimmedLine)) {
      flushParagraph()
      closeList()
      htmlParts.push(PAGE_BREAK_ELEMENT)
      previousLineBlank = true
      continue
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      closeList()
      const level = headingMatch[1].length
      htmlParts.push(`<h${level}>${escapeHtml(headingMatch[2].trim())}</h${level}>`)
      previousLineBlank = false
      continue
    }

    const numericMatch = trimmedLine.match(/^(\d+(?:\.\d+)*)(?:\.)?\s+(.*)$/)
    if (numericMatch && previousLineBlank) {
      flushParagraph()
      closeList()
      const depth = numericMatch[1].split(".").length
      const level = Math.min(depth + 1, 6)
      htmlParts.push(`<h${level}>${escapeHtml(numericMatch[2].trim())}</h${level}>`)
      previousLineBlank = false
      continue
    }

    const unorderedMatch = trimmedLine.match(/^[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (listType !== "ul") {
        closeList()
        htmlParts.push("<ul>")
        listType = "ul"
      }
      htmlParts.push(`<li>${escapeHtml(unorderedMatch[1])}</li>`)
      previousLineBlank = false
      continue
    }

    const orderedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (listType !== "ol") {
        closeList()
        htmlParts.push("<ol>")
        listType = "ol"
      }
      htmlParts.push(`<li>${escapeHtml(orderedMatch[1])}</li>`)
      previousLineBlank = false
      continue
    }

    paragraphBuffer.push(trimmedLine)
    previousLineBlank = false
  }

  flushParagraph()
  closeList()

  return htmlParts.join("\n")
}

interface PagedPreviewProps {
  content: string
  title?: string
  author?: string
  theme?: "modern" | "classic" | "creative"
  zoom?: number
  onZoomChange?: (zoom: number) => void
  onExport?: () => void
  className?: string
}

const THEME_STYLES: Record<string, Record<string, string>> = {
  modern: {
    "--font-body": "Georgia, serif",
    "--font-header": "Segoe UI, sans-serif",
    "--margin-outer": "0.75in",
    "--margin-inner": "1in",
    "--line-height": "1.6",
    "--color-text": "#000",
    "--color-bg": "#fff",
  },
  classic: {
    "--font-body": "Libre Baskerville, serif",
    "--font-header": "Libre Baskerville, serif",
    "--margin-outer": "1in",
    "--margin-inner": "1.25in",
    "--line-height": "1.65",
    "--color-text": "#1a1a1a",
    "--color-bg": "#fafaf8",
  },
  creative: {
    "--font-body": "Inter, sans-serif",
    "--font-header": "Poppins, sans-serif",
    "--margin-outer": "0.75in",
    "--margin-inner": "0.9in",
    "--line-height": "1.7",
    "--color-text": "#2c3e50",
    "--color-bg": "#fff",
  },
}

type PreviewFormat = "laptop" | "tablet" | "mobile" | "ereader"

const FORMAT_PRESETS: Record<
  PreviewFormat,
  {
    label: string
    icon: React.ElementType
    pageWidth: string
    pageHeight: string
    viewportWidth: number
    pagePixelHeight: number
  }
> = {
  laptop: {
    label: "Laptop",
    icon: Monitor,
    pageWidth: "6in",
    pageHeight: "9in",
    viewportWidth: 760,
    pagePixelHeight: 1040,
  },
  tablet: {
    label: "Tablet",
    icon: Tablet,
    pageWidth: "5.5in",
    pageHeight: "8.5in",
    viewportWidth: 640,
    pagePixelHeight: 980,
  },
  mobile: {
    label: "Móvil",
    icon: Smartphone,
    pageWidth: "3.7in",
    pageHeight: "6.2in",
    viewportWidth: 420,
    pagePixelHeight: 760,
  },
  ereader: {
    label: "eBook",
    icon: BookOpen,
    pageWidth: "5in",
    pageHeight: "7.5in",
    viewportWidth: 560,
    pagePixelHeight: 900,
  },
}

export default function PagedPreview({
  content,
  title = "Untitled",
  author = "Author",
  theme = "modern",
  zoom = 75,
  onZoomChange,
  onExport,
  className,
}: PagedPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [pageCount, setPageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [format, setFormat] = useState<PreviewFormat>("laptop")
  const formatPreset = FORMAT_PRESETS[format]
  const singlePageHeight = formatPreset.pagePixelHeight
  const computedHeight =
    pageCount > 0
      ? Math.max(singlePageHeight + 200, pageCount * singlePageHeight + 200)
      : singlePageHeight + 200
  const viewportWidth = formatPreset.viewportWidth * (currentZoom / 100)

  const preparedContent = useMemo(() => {
    const trimmed = (content || "").trim()
    if (!trimmed) {
      return "<p></p>"
    }

    if (looksLikeHtml(trimmed)) {
      return replacePageBreakMarkers(trimmed, PAGE_BREAK_ELEMENT)
    }

    const converted = convertMarkdownToHtml(trimmed)
    return replacePageBreakMarkers(converted, PAGE_BREAK_ELEMENT)
  }, [content])

  // Update zoom
  const handleZoomChange = (value: number[]) => {
    setCurrentZoom(value[0])
    onZoomChange?.(value[0])
  }

  // Initialize Paged.js in iframe
  useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) {
      console.error("Could not access iframe document")
      return
    }

    setIsLoading(true)

    // Create HTML structure with Paged.js styles
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>

        <!-- Paged.js CSS -->
        <link rel="stylesheet" href="https://unpkg.com/pagedjs/dist/paged.css">

        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600&family=Poppins:wght@400;600&display=swap" rel="stylesheet">

        <style>
          :root {
            ${Object.entries(THEME_STYLES[theme])
              .map(([key, value]) => `${key}: ${value};`)
              .join("\n")}
            --page-width: ${formatPreset.pageWidth};
            --page-height: ${formatPreset.pageHeight};
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: var(--font-body);
            color: var(--color-text);
            background-color: var(--color-bg);
            line-height: var(--line-height);
            max-width: var(--page-width);
            margin: 0 auto;
          }

          @page {
            size: var(--page-width) var(--page-height);
            margin: var(--margin-outer) var(--margin-inner);

            @top-center {
              content: string(chapter-title);
              font-size: 10pt;
              color: #999;
            }

            @bottom-center {
              content: counter(page);
              font-size: 11pt;
            }
          }

          @page :first {
            @top-center {
              content: "";
            }

            @bottom-center {
              content: "";
            }
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-header);
            font-weight: 700;
            margin: 1.5em 0 0.5em 0;
            line-height: 1.3;
            page-break-after: avoid;
          }

          h1 {
            font-size: 2em;
            string-set: chapter-title content();
            page-break-before: always;
            break-before: page;
          }

          body h1:first-of-type {
            page-break-before: avoid;
            break-before: auto;
          }

          h2 {
            font-size: 1.5em;
            string-set: chapter-title content();
          }

          h3 {
            font-size: 1.2em;
          }

          p {
            margin: 0 0 1em 0;
            orphans: 2;
            widows: 2;
            break-inside: avoid;
          }

          p + p {
            text-indent: 1.5em;
            margin-top: 0;
          }

          blockquote {
            margin: 1.5em 2em;
            padding-left: 1em;
            border-left: 3px solid #ccc;
            font-style: italic;
            color: #666;
            page-break-inside: avoid;
          }

          ul, ol {
            margin: 1em 0 1em 2em;
            padding: 0;
          }

          li {
            margin: 0.5em 0;
          }

          hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 2em 0;
            page-break-after: avoid;
          }

          .page-break {
            display: block;
            width: 100%;
            border: none;
            height: 0;
            margin: 0;
            page-break-before: always;
            break-before: page;
          }

          code {
            font-family: "Courier New", monospace;
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
          }

          pre {
            background-color: #f5f5f5;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
            margin: 1em 0;
          }

          pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
          }

          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em 0;
          }

          /* Print-specific adjustments */
          @media print {
            body {
              background-color: white;
            }

            a {
              color: #000;
              text-decoration: none;
            }
          }
        </style>
      </head>
      <body>
        ${preparedContent}
      </body>

      <!-- Paged.js Script -->
      <script src="https://unpkg.com/pagedjs"></script>
      <script>
        // Initialize Paged.js
        Paged.preview().then(() => {
          console.log("Paged.js initialized");
          // Update page count
          const pages = document.querySelectorAll(".pagedjs_page");
          window.parent.postMessage({
            type: "pageCount",
            count: pages.length
          }, "*");
        });
      </script>
    `

    doc.open()
    doc.write(html)
    doc.close()

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "pageCount") {
        setPageCount(event.data.count)
        setIsLoading(false)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [preparedContent, theme, title, format])

  return (
    <div className={cn("flex flex-col h-full bg-muted/20 rounded-lg border", className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-background p-4 flex items-center justify-between gap-4">
        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange([Math.max(50, currentZoom - 10)])}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="w-32">
            <Slider
              value={[currentZoom]}
              onValueChange={handleZoomChange}
              min={50}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange([Math.min(150, currentZoom + 10)])}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-12 text-right">
            {currentZoom}%
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 border-l border-border" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <span>{pageCount} pages</span>
          )}
        </div>

        {/* Format Toggle */}
        <div className="flex items-center gap-1">
          {Object.entries(FORMAT_PRESETS).map(([key, preset]) => {
            const Icon = preset.icon
            const isActive = key === format
            return (
              <Button
                key={key}
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 px-3",
                  !isActive && "text-muted-foreground"
                )}
                onClick={() => setFormat(key as PreviewFormat)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{preset.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto bg-muted/30 p-8 flex justify-center">
        <iframe
          ref={iframeRef}
          className="bg-white shadow-lg rounded"
          style={{
            width: `${viewportWidth}px`,
            minWidth: "320px",
            maxWidth: "100%",
            height: `${computedHeight}px`,
            border: "1px solid #ddd",
            backgroundColor: "#fff",
          }}
          title="Book Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>

      {/* Info Footer */}
      {!isLoading && (
        <div className="border-t border-border bg-muted/30 px-6 py-3 text-sm text-muted-foreground text-center">
          <p>
            This preview uses Paged.js CSS standards. What you see here is
            exactly what will be exported to PDF.
          </p>
        </div>
      )}
    </div>
  )
}
