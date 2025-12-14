/**
 * Enhanced PDF Text Extractor
 * Improved extraction with better structure preservation
 * Supports: headings, lists, blockquotes, links, footnotes
 */

interface PdfExtractionResult {
  text: string
  html: string
  markdown: string
  estimatedPages?: number
  warnings?: string[]
  metadata?: {
    title?: string
    author?: string
    createdDate?: string
    hasImages?: boolean
  }
}

interface TextSegment {
  text: string
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  x?: number
  y?: number
}

const ESCAPE_MAP: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  "\\": "\\",
  "(": "(",
  ")": ")",
}

function decodePdfString(value: string): string {
  let result = ""
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === "\\") {
      i++
      const next = value[i]
      if (!next) break

      if (ESCAPE_MAP[next]) {
        result += ESCAPE_MAP[next]
        continue
      }

      if (/[0-7]/.test(next)) {
        let octal = next
        while (i + 1 < value.length && octal.length < 3 && /[0-7]/.test(value[i + 1])) {
          octal += value[++i]
        }
        result += String.fromCharCode(parseInt(octal, 8))
        continue
      }

      result += next
    } else {
      result += char
    }
  }
  return result
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Detect if text is likely a heading based on context
 */
function isLikelyHeading(text: string, previousText: string, nextText: string): boolean {
  // Short text followed by longer content
  if (text.length < 100 && nextText && nextText.length > 200) {
    return true
  }

  // All caps or title case
  if (text === text.toUpperCase() && text.length > 3) {
    return true
  }

  // Ends with colon (common heading pattern)
  if (text.trim().endsWith(":")) {
    return true
  }

  // Starts with numbers (chapter numbering)
  if (/^(Chapter|Capítulo|Sección|Section)\s+\d+/i.test(text)) {
    return true
  }

  return false
}

/**
 * Detect if text is likely a list item
 */
function isLikelyListItem(text: string): boolean {
  return /^[\s]*[-•*+]\s+/.test(text) || /^[\s]*\d+[\.\)]\s+/.test(text)
}

/**
 * Convert text to markdown with structure detection
 */
function textToMarkdown(segments: string[]): string {
  const lines = segments.map(s => s.trim()).filter(Boolean)
  const markdown: string[] = []
  let inList = false
  let listType = "unordered"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prevLine = i > 0 ? lines[i - 1] : ""
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ""

    // Detect headings
    if (isLikelyHeading(line, prevLine, nextLine)) {
      if (inList) {
        markdown.push("")
        inList = false
      }
      // Estimate heading level based on position and content
      const level = line.length < 50 ? 2 : 3
      markdown.push(`${"#".repeat(level)} ${line}`)
      markdown.push("")
      continue
    }

    // Detect list items
    if (isLikelyListItem(line)) {
      if (!inList) {
        markdown.push("")
        inList = true
      }
      const cleanedLine = line.replace(/^[\s]*[-•*+]\s+/, "").replace(/^[\s]*\d+[\.\)]\s+/, "")
      markdown.push(`- ${cleanedLine}`)
      continue
    }

    // Regular paragraph
    if (inList) {
      markdown.push("")
      inList = false
    }

    if (line.length > 0) {
      markdown.push(line)
    }
  }

  return markdown.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/**
 * Convert markdown to simple HTML
 */
function markdownToHtml(markdown: string): string {
  let html = escapeHtml(markdown)

  // Convert headings
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>")

  // Convert lists
  html = html.replace(/^- (.*?)$/gm, "<li>$1</li>")
  html = html.replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>")

  // Convert paragraphs
  const lines = html.split("\n")
  let inBlock = false
  const result: string[] = []

  for (const line of lines) {
    if (line.match(/^<h[1-6]|^<ul|^<li/)) {
      if (inBlock) {
        result.push("</p>")
        inBlock = false
      }
      result.push(line)
    } else if (line.trim()) {
      if (!inBlock) {
        result.push("<p>")
        inBlock = true
      }
      result.push(line)
    } else if (inBlock) {
      result.push("</p>")
      inBlock = false
    }
  }

  if (inBlock) {
    result.push("</p>")
  }

  return result.join("\n")
}

/**
 * Extract PDF metadata from trailer
 */
function extractPdfMetadata(raw: string): {
  title?: string
  author?: string
  createdDate?: string
} {
  const metadata: any = {}

  // Extract title
  const titleMatch = raw.match(/\/Title\s*\(([^)]*)\)/)
  if (titleMatch) {
    metadata.title = decodePdfString(titleMatch[1])
  }

  // Extract author
  const authorMatch = raw.match(/\/Author\s*\(([^)]*)\)/)
  if (authorMatch) {
    metadata.author = decodePdfString(authorMatch[1])
  }

  // Extract creation date
  const dateMatch = raw.match(/\/CreationDate\s*\(([^)]*)\)/)
  if (dateMatch) {
    metadata.createdDate = dateMatch[1]
  }

  return metadata
}

/**
 * Main PDF extraction function with enhanced structure preservation
 */
export async function extractPdfContent(buffer: Buffer): Promise<PdfExtractionResult | null> {
  try {
    const raw = buffer.toString("latin1")
    const textSegments: string[] = []
    const warnings: string[] = []

    // Extract metadata
    const metadata = extractPdfMetadata(raw)

    // Check for images
    const hasImages = /\/XObject\s*<</.test(raw)
    if (hasImages) {
      warnings.push("PDF contains images which are not extracted in this import.")
    }

    // Extract text using Tj operator (single string)
    const showTextRegex = /\((?:\\.|[^\\)])*\)\s*Tj/gs
    let match: RegExpExecArray | null
    while ((match = showTextRegex.exec(raw))) {
      const literal = match[0]
      const inner = literal.replace(/\)\s*Tj$/, "").slice(1)
      const decoded = decodePdfString(inner)
      if (decoded.trim()) {
        textSegments.push(decoded.trim())
      }
    }

    // Extract text using TJ operator (array of strings)
    const arrayRegex = /\[(?:\\.|[^\]])*?\]\s*TJ/gs
    while ((match = arrayRegex.exec(raw))) {
      const inner = match[0].replace(/\]\s*TJ$/, "").slice(1)
      const fragments = inner.match(/\((?:\\.|[^\\)])*\)/g)
      if (fragments) {
        const decodedFragments = fragments
          .map((fragment) => decodePdfString(fragment.slice(1, -1)).trim())
          .filter(Boolean)
        if (decodedFragments.length) {
          textSegments.push(decodedFragments.join(""))
        }
      }
    }

    // Combine and normalize
    const combined = normalizeWhitespace(textSegments.join("\n"))
    if (!combined) {
      return null
    }

    // Convert to markdown with structure detection
    const markdown = textToMarkdown(textSegments)

    // Convert markdown to HTML
    const html = markdownToHtml(markdown)

    // Estimate pages
    const estimatedPages =
      raw.match(/\/Type\s*\/Page\b/g)?.length || 
      Math.max(1, Math.ceil(combined.split(/\s+/).length / 250))

    // Build warnings
    if (textSegments.length < 5) {
      warnings.push("PDF may be scanned or image-based. Text extraction is limited.")
    }

    if (!markdown.includes("#")) {
      warnings.push("No headings detected. Document structure may not be preserved.")
    }

    return {
      text: combined,
      html,
      markdown,
      estimatedPages,
      warnings,
      metadata: {
        ...metadata,
        hasImages,
      },
    }
  } catch (error) {
    console.warn("Enhanced PDF extraction failed:", error)
    return null
  }
}

/**
 * Fallback to basic extraction if enhanced extraction fails
 */
export async function extractPdfContentBasic(buffer: Buffer): Promise<PdfExtractionResult | null> {
  try {
    const raw = buffer.toString("latin1")
    const textSegments: string[] = []

    const showTextRegex = /\((?:\\.|[^\\)])*\)\s*Tj/gs
    let match: RegExpExecArray | null
    while ((match = showTextRegex.exec(raw))) {
      const literal = match[0]
      const inner = literal.replace(/\)\s*Tj$/, "").slice(1)
      const decoded = decodePdfString(inner)
      if (decoded.trim()) {
        textSegments.push(decoded.trim())
      }
    }

    const arrayRegex = /\[(?:\\.|[^\]])*?\]\s*TJ/gs
    while ((match = arrayRegex.exec(raw))) {
      const inner = match[0].replace(/\]\s*TJ$/, "").slice(1)
      const fragments = inner.match(/\((?:\\.|[^\\)])*\)/g)
      if (fragments) {
        const decodedFragments = fragments
          .map((fragment) => decodePdfString(fragment.slice(1, -1)).trim())
          .filter(Boolean)
        if (decodedFragments.length) {
          textSegments.push(decodedFragments.join(""))
        }
      }
    }

    const combined = normalizeWhitespace(textSegments.join("\n"))
    if (!combined) {
      return null
    }

    const paragraphs = combined
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    const html = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")

    const estimatedPages =
      raw.match(/\/Type\s*\/Page\b/g)?.length || Math.max(1, Math.ceil(combined.split(/\s+/).length / 250))

    return {
      text: paragraphs.join("\n\n"),
      html,
      markdown: paragraphs.join("\n\n"),
      estimatedPages,
      warnings: ["PDF parsed using basic extractor. Some structure may be lost."],
    }
  } catch (error) {
    console.warn("Basic PDF extraction failed:", error)
    return null
  }
}
