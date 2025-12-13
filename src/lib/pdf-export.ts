/**
 * PDF Export Module
 * Generates PDFs using Paged.js with print-perfect fidelity
 */

export interface PDFExportOptions {
  title?: string
  author?: string
  subject?: string
  creator?: string
  pageSize?: "6x9" | "a4" | "a5" | "letter"
  pageMargins?: {
    outer: string
    inner: string
    top: string
    bottom: string
  }
  theme?: "modern" | "classic" | "creative"
  includePageNumbers?: boolean
  includeHeaders?: boolean
  lineNumbers?: boolean
}

const DEFAULT_MARGINS = {
  outer: "0.75in",
  inner: "1in",
  top: "0.75in",
  bottom: "0.75in",
}

const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  "6x9": { width: "6in", height: "9in" },
  a4: { width: "210mm", height: "297mm" },
  a5: { width: "148mm", height: "210mm" },
  letter: { width: "8.5in", height: "11in" },
}

const THEMES = {
  modern: {
    fontBody: "Georgia, serif",
    fontHeader: "Segoe UI, sans-serif",
    colorText: "#000",
    colorBg: "#fff",
    lineHeight: "1.6",
  },
  classic: {
    fontBody: "Libre Baskerville, serif",
    fontHeader: "Libre Baskerville, serif",
    colorText: "#1a1a1a",
    colorBg: "#fafaf8",
    lineHeight: "1.65",
  },
  creative: {
    fontBody: "Inter, sans-serif",
    fontHeader: "Poppins, sans-serif",
    colorText: "#2c3e50",
    colorBg: "#fff",
    lineHeight: "1.7",
  },
}

/**
 * Generate printable HTML document with Paged.js styles
 */
export function generatePrintableHTML(
  content: string,
  options: PDFExportOptions = {}
): string {
  const {
    title = "Untitled",
    author = "Author",
    pageSize = "6x9",
    pageMargins = DEFAULT_MARGINS,
    theme = "modern",
    includePageNumbers = true,
    includeHeaders = true,
  } = options

  const size = PAGE_SIZES[pageSize]
  const themeStyles = THEMES[theme]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="${escapeHtml(author)}">
  <title>${escapeHtml(title)}</title>

  <!-- Paged.js for print pagination -->
  <script src="https://unpkg.com/pagedjs"></script>

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600&family=Poppins:wght@400;600&family=Segoe+UI:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      background-color: #f5f5f5;
    }

    body {
      font-family: ${themeStyles.fontBody};
      font-size: 11pt;
      line-height: ${themeStyles.lineHeight};
      color: ${themeStyles.colorText};
      background-color: ${themeStyles.colorBg};
    }

    /* Paged.js Configuration */
    @page {
      size: ${size.width} ${size.height};
      margin: ${pageMargins.outer} ${pageMargins.inner};

      ${
        includePageNumbers
          ? `
      @bottom-center {
        content: counter(page);
        font-size: 10pt;
        color: #999;
      }
      `
          : ""
      }

      ${
        includeHeaders
          ? `
      @top-center {
        content: string(chapter-title);
        font-size: 9pt;
        color: #999;
        font-style: italic;
      }
      `
          : ""
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

    @page :blank {
      @top-center {
        content: "";
      }

      @bottom-center {
        content: "";
      }
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: ${themeStyles.fontHeader};
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
      page-break-after: avoid;
      color: ${themeStyles.colorText};
    }

    h1 {
      font-size: 2em;
      string-set: chapter-title content();
    }

    h2 {
      font-size: 1.5em;
      string-set: chapter-title content();
    }

    h3 {
      font-size: 1.2em;
    }

    h4 {
      font-size: 1.1em;
    }

    h5 {
      font-size: 1em;
    }

    h6 {
      font-size: 0.95em;
    }

    p {
      margin: 0 0 1em 0;
      orphans: 2;
      widows: 2;
      break-inside: avoid;
      text-align: justify;
    }

    p + p {
      text-indent: 1.5em;
      margin-top: 0;
    }

    p:first-of-type,
    h1 + p,
    h2 + p,
    h3 + p {
      text-indent: 0;
    }

    /* Lists */
    ul, ol {
      margin: 1em 0 1em 2em;
      padding: 0;
    }

    li {
      margin: 0.5em 0;
      break-inside: avoid;
    }

    /* Blockquotes */
    blockquote {
      margin: 1.5em 2em;
      padding-left: 1em;
      border-left: 3px solid ${themeStyles.colorText};
      font-style: italic;
      color: #666;
      page-break-inside: avoid;
    }

    blockquote p {
      text-indent: 0;
    }

    /* Horizontal Rule */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2em 0;
      page-break-after: avoid;
    }

    /* Code */
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
      font-size: 0.9em;
      break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em 0;
      break-inside: avoid;
    }

    /* Links */
    a {
      color: #0066cc;
      text-decoration: none;
    }

    @media print {
      a {
        color: #000;
        text-decoration: underline;
      }
    }

    /* Strong/Emphasis */
    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    /* Tables */
    table {
      margin: 1em 0;
      border-collapse: collapse;
      width: 100%;
      break-inside: avoid;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 0.5em;
      text-align: left;
    }

    th {
      background-color: #f5f5f5;
      font-weight: 700;
    }

    /* Utility Classes */
    .page-break {
      page-break-after: always;
    }

    .avoid-break {
      break-inside: avoid;
    }

    .no-indent {
      text-indent: 0 !important;
    }

    /* Cover Page (optional) */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      page-break-after: always;
      text-align: center;
    }

    .cover-title {
      font-size: 3em;
      margin-bottom: 1em;
      font-weight: 700;
    }

    .cover-subtitle {
      font-size: 1.5em;
      margin-bottom: 3em;
      color: #666;
    }

    .cover-author {
      font-size: 1.2em;
      margin-top: 3em;
      color: #999;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`

  return html
}

/**
 * Create a data URL for printing (for browser print dialog)
 */
export function generatePrintableDataURL(
  content: string,
  options: PDFExportOptions = {}
): string {
  const html = generatePrintableHTML(content, options)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  return URL.createObjectURL(blob)
}

/**
 * Get metadata for PDF creation
 */
export function getPDFMetadata(options: PDFExportOptions) {
  return {
    title: options.title || "Untitled",
    author: options.author || "Author",
    subject: options.subject || "",
    creator: options.creator || "Anclora Press",
    producer: "Anclora Press (Paged.js)",
    creationDate: new Date().toISOString(),
  }
}

/**
 * Helper: Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Get recommended page size based on content length
 */
export function recommendPageSize(
  contentLength: number
): "6x9" | "a4" | "a5" | "letter" {
  if (contentLength > 200000) return "6x9" // Novel
  if (contentLength > 100000) return "a4" // Long article
  return "letter" // Default
}

/**
 * Create export presets
 */
export const EXPORT_PRESETS = {
  novel: {
    pageSize: "6x9" as const,
    theme: "classic" as const,
    includePageNumbers: true,
    includeHeaders: true,
  },
  article: {
    pageSize: "a4" as const,
    theme: "modern" as const,
    includePageNumbers: true,
    includeHeaders: false,
  },
  academic: {
    pageSize: "letter" as const,
    theme: "modern" as const,
    includePageNumbers: true,
    includeHeaders: true,
  },
  minimal: {
    pageSize: "a4" as const,
    theme: "creative" as const,
    includePageNumbers: false,
    includeHeaders: false,
  },
}
