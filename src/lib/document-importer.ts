/**
 * Document Importer - Semantic conversion using Mammoth.js
 * Converts DOCX files to semantic HTML preserving structure
 */

import mammoth from "mammoth"
import JSZip from "jszip"

type DocxStatistics = {
  pages?: number
  words?: number
}

export interface ImportedDocument {
  title: string
  content: string // HTML content
  markdown?: string // Markdown equivalent for plain editors
  metadata: {
    wordCount: number
    estimatedPages: number
    author?: string
    createdDate?: string
    headingCount: number
    paragraphCount: number
  }
  warnings: string[]
}

/**
 * Convert DOCX buffer to semantic HTML using Mammoth.js
 * Mammoth focuses on semantic structure, not visual styling
 */
export async function convertDocxToHtml(
  buffer: Buffer
): Promise<{
  html: string
  warnings: string[]
}> {
  try {
    const result = await mammoth.convertToHtml({ buffer })

    return {
      html: result.value,
      warnings: result.messages.map((msg) => msg.message),
    }
  } catch (error) {
    throw new Error(
      `DOCX conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Convert DOCX buffer to Markdown for plain text editors
 */
export async function convertDocxToMarkdown(
  buffer: Buffer
): Promise<{
  markdown: string
  warnings: string[]
}> {
  try {
    const result = await mammoth.convertToMarkdown({ buffer })

    return {
      markdown: result.value,
      warnings: result.messages.map((msg) => msg.message),
    }
  } catch (error) {
    throw new Error(
      `DOCX markdown conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Extract metadata from HTML content
 */
export function extractMetadata(html: string): {
  wordCount: number
  estimatedPages: number
  headingCount: number
  paragraphCount: number
  title: string
} {
  // Count words
  const textContent = html.replace(/<[^>]*>/g, " ")
  const wordCount = textContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  // Estimate pages (200 words per page, conservative)
  const estimatedPages = Math.ceil(wordCount / 200)

  // Count headings and paragraphs
  const headingCount = (html.match(/<h[1-6]/gi) || []).length
  const paragraphCount = (html.match(/<p[^>]*>/gi) || []).length

  // Extract title from first h1 or h2
  const titleMatch = html.match(/<h[1-2][^>]*>([^<]+)<\/h[1-2]>/i)
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
    : "Untitled Document"

  return {
    wordCount,
    estimatedPages,
    headingCount,
    paragraphCount,
    title,
  }
}

/**
 * Clean HTML from Mammoth - remove unnecessary attributes, keep structure
 */
export function cleanHtml(html: string): string {
  let cleaned = html

  // Remove style attributes (we'll use CSS classes)
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, "")

  // Remove lang attributes
  cleaned = cleaned.replace(/\s+lang="[^"]*"/gi, "")

  // Remove data attributes that aren't needed
  cleaned = cleaned.replace(/\s+data-[^=]*="[^"]*"/gi, "")

  // Normalize whitespace
  cleaned = cleaned
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .trim()

  return cleaned
}

/**
 * Convert Word styles to semantic HTML classes
 * Maps Word's built-in styles to our design system
 */
export function mapWordStylesToClasses(html: string): {
  html: string
  mappings: Record<string, string>
} {
  const mappings: Record<string, string> = {
    "Heading 1": "heading-1",
    "Heading 2": "heading-2",
    "Heading 3": "heading-3",
    "Normal": "body-text",
    "Body Text": "body-text",
    "List Paragraph": "list-item",
    "Quote": "block-quote",
    "Code": "inline-code",
  }

  let converted = html

  // This is a placeholder - in a real scenario, Mammoth preserves
  // semantic structure already, so we mainly need to ensure proper
  // h1-h6 tags are used for headings

  // Ensure consistent heading structure
  converted = converted
    .replace(/<h1/g, '<h1 class="heading-1"')
    .replace(/<h2/g, '<h2 class="heading-2"')
    .replace(/<h3/g, '<h3 class="heading-3"')
    .replace(/<h4/g, '<h4 class="heading-4"')
    .replace(/<h5/g, '<h5 class="heading-5"')
    .replace(/<h6/g, '<h6 class="heading-6"')

  // Ensure blockquotes have proper classes
  converted = converted.replace(
    /<blockquote([^>]*)>/g,
    '<blockquote class="block-quote"$1>'
  )

  return {
    html: converted,
    mappings,
  }
}

/**
 * Validate document structure
 */
export function validateDocument(html: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for basic structure
  if (!html.includes("<p")) {
    warnings.push("No paragraphs found - document may be empty or improperly formatted")
  }

  // Check for suspicious patterns
  if (html.length > 5000000) {
    errors.push("Document is too large (>5MB)")
  }

  // Check for proper heading hierarchy
  const h1Count = (html.match(/<h1/gi) || []).length
  const h2Count = (html.match(/<h2/gi) || []).length

  if (h1Count === 0 && h2Count === 0) {
    warnings.push(
      "No headings found - consider adding a title to organize content"
    )
  }

  // Check for unmatched tags
  const openTags = html.match(/<\w+[^>]*>/g) || []
  const closeTags = html.match(/<\/\w+>/g) || []

  if (openTags.length !== closeTags.length) {
    warnings.push("HTML structure may have unmatched tags")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Main import function - orchestrates the full pipeline
 */
async function extractDocxStatistics(
  buffer: Buffer
): Promise<DocxStatistics> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const appXml = zip.file("docProps/app.xml")
    if (!appXml) return {}
    const xml = await appXml.async("text")

    const pageMatch = xml.match(/<Pages>(\d+)<\/Pages>/i)
    const wordMatch = xml.match(/<Words>(\d+)<\/Words>/i)

    return {
      pages: pageMatch ? parseInt(pageMatch[1], 10) : undefined,
      words: wordMatch ? parseInt(wordMatch[1], 10) : undefined,
    }
  } catch (error) {
    console.warn("DOCX metadata extraction failed:", error)
    return {}
  }
}

export async function importDocument(
  buffer: Buffer,
  fileName: string
): Promise<ImportedDocument> {
  try {
    const docxStatsPromise: Promise<DocxStatistics> =
      fileName.toLowerCase().endsWith(".docx")
        ? extractDocxStatistics(buffer)
        : Promise.resolve({})

    // Step 1: Convert DOCX to HTML
    const [htmlResult, markdownResult] = await Promise.all([
      convertDocxToHtml(buffer),
      convertDocxToMarkdown(buffer),
    ])

    const { html: rawHtml, warnings: conversionWarnings } = htmlResult

    // Step 2: Clean HTML
    const cleanedHtml = cleanHtml(rawHtml)

    // Step 3: Map Word styles to semantic classes
    const { html: styledHtml } = mapWordStylesToClasses(cleanedHtml)

    // Step 4: Extract metadata
    const docxStats = await docxStatsPromise
    let metadata = extractMetadata(styledHtml)

    metadata = {
      ...metadata,
      estimatedPages:
        docxStats.pages && docxStats.pages > 0
          ? docxStats.pages
          : metadata.estimatedPages,
      wordCount:
        docxStats.words && docxStats.words > 0
          ? docxStats.words
          : metadata.wordCount,
    }

    // Step 5: Validate
    const validation = validateDocument(styledHtml)

    // Combine all warnings
    const allWarnings = [
      ...conversionWarnings,
      ...(markdownResult?.warnings || []),
      ...validation.warnings,
    ]

    // Step 6: Return structured document
    return {
      title: metadata.title,
      content: styledHtml,
      markdown: markdownResult?.markdown,
      metadata: {
        wordCount: metadata.wordCount,
        estimatedPages: metadata.estimatedPages,
        headingCount: metadata.headingCount,
        paragraphCount: metadata.paragraphCount,
      },
      warnings: allWarnings,
    }
  } catch (error) {
    throw new Error(
      `Document import failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
