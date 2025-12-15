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

export interface StructuredChapter {
  title: string
  level: number
  html: string
  markdown: string
  wordCount: number
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
  chapters?: StructuredChapter[]
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
    const normalized = normalizeMarkdownEscapes(result.value)
    return {
      markdown: normalized,
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

  converted = converted.replace(
    /<p[^>]*class="[^"]*(heading[-\s]?([1-6]))[^"]*"[^>]*>(.*?)<\/p>/gis,
    (_match, _headingClass, level, inner) =>
      `<h${level} class="heading-${level}">${inner}</h${level}>`
  )

  return {
    html: converted,
    mappings,
  }
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ")
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function markdownToSimpleHtml(markdown: string): string {
  const blocks = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (!blocks.length) {
    return `<p>${escapeHtml(markdown)}</p>`
  }

  return blocks
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join("\n")
}

function normalizeMarkdownEscapes(markdown: string): string {
  return markdown.replace(/\\([\\`*_{}\[\]()#+\-.!<>~|])/g, "$1")
}

function extractPrefaceFromHtml(html: string): StructuredChapter | null {
  const headingMatch = html.match(/<h[1-6][^>]*>/i)
  const firstHeadingIndex = headingMatch?.index ?? -1
  const prefaceHtml =
    firstHeadingIndex > 0 ? html.slice(0, firstHeadingIndex) : ""

  if (!prefaceHtml || !stripHtmlTags(prefaceHtml).trim()) {
    return null
  }

  const firstParagraphMatch = prefaceHtml.match(/<p[^>]*>(.*?)<\/p>/i)
  const title = firstParagraphMatch
    ? normalizeWhitespace(stripHtmlTags(firstParagraphMatch[0]))
    : "Introducción"
  const wordCount = stripHtmlTags(prefaceHtml)
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return {
    title,
    level: 0,
    html: prefaceHtml,
    markdown: htmlToPlainText(prefaceHtml),
    wordCount,
  }
}

function extractPrefaceFromMarkdown(markdown: string): StructuredChapter | null {
  const lines = markdown.split(/\r?\n/)
  const headingRegex = /^(#{1,6})\s+/
  const firstHeadingIndex = lines.findIndex((line) => headingRegex.test(line))
  const prefaceLines =
    firstHeadingIndex === -1 ? lines : lines.slice(0, firstHeadingIndex)
  const content = prefaceLines.join("\n").trim()

  if (!content) {
    return null
  }

  const titleLine =
    prefaceLines.find((line) => line.trim().length > 0)?.trim() || "Introducción"
  const cleanedTitle = normalizeWhitespace(
    titleLine.replace(/[*_`#]/g, "")
  )
  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return {
    title: cleanedTitle || "Introducción",
    level: 0,
    html: markdownToSimpleHtml(content),
    markdown: content,
    wordCount,
  }
}

function mergeChapterSections(
  htmlSection?: StructuredChapter | null,
  markdownSection?: StructuredChapter | null,
  fallbackTitle?: string
): StructuredChapter | null {
  if (!htmlSection && !markdownSection) {
    return null
  }

  const title =
    htmlSection?.title || markdownSection?.title || fallbackTitle || "Sección"
  const level = htmlSection?.level || markdownSection?.level || 1
  const htmlContent =
    htmlSection?.html ||
    (markdownSection ? markdownToSimpleHtml(markdownSection.markdown) : "")
  const markdownContent =
    markdownSection?.markdown ||
    (htmlSection ? htmlToPlainText(htmlSection.html) : "")
  const wordCount =
    htmlSection?.wordCount ||
    markdownSection?.wordCount ||
    markdownContent.split(/\s+/).filter((word) => word.length > 0).length

  return {
    title,
    level,
    html: htmlContent,
    markdown: markdownContent,
    wordCount,
  }
}

function extractChaptersFromHtmlSections(html: string): StructuredChapter[] {
  const headingRegex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
  const matches = [...html.matchAll(headingRegex)]
  if (!matches.length) {
    return []
  }

  const chapters: StructuredChapter[] = []

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const level = parseInt(match[1], 10)
    const title =
      normalizeWhitespace(stripHtmlTags(match[2])) ||
      `Sección ${chapters.length + 1}`
    const startIndex = match.index ?? 0
    const endIndex =
      i + 1 < matches.length ? matches[i + 1].index ?? html.length : html.length
    const sectionHtml = html.slice(startIndex, endIndex)
    const wordCount = stripHtmlTags(sectionHtml)
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    chapters.push({
      title,
      level,
      html: sectionHtml,
      markdown: "",
      wordCount,
    })
  }

  return chapters
}

function extractChaptersFromMarkdown(markdown: string): StructuredChapter[] {
  const lines = markdown.split(/\r?\n/)
  const headingRegex = /^(#{1,6})\s+(.*)$/
  const chapters: StructuredChapter[] = []
  let current: { title: string; level: number; lines: string[] } | null = null

  for (const line of lines) {
    const match = line.match(headingRegex)
    if (match) {
      if (current) {
        const markdownContent = current.lines.join("\n").trim()
        chapters.push({
          title: current.title,
          level: current.level,
          html: "",
          markdown: markdownContent,
          wordCount: markdownContent
            .replace(/^#+\s+/gm, "")
            .split(/\s+/)
            .filter((word) => word.length > 0).length,
        })
      }
      current = {
        title: match[2].trim(),
        level: match[1].length,
        lines: [line],
      }
    } else if (current) {
      current.lines.push(line)
    }
  }

  if (current) {
    const markdownContent = current.lines.join("\n").trim()
    chapters.push({
      title: current.title,
      level: current.level,
      html: "",
      markdown: markdownContent,
      wordCount: markdownContent
        .replace(/^#+\s+/gm, "")
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    })
  }

  return chapters
}

export function buildStructuredChapters(
  html?: string,
  markdown?: string
): StructuredChapter[] {
  if (!html && !markdown) {
    return []
  }

  const htmlSections = html ? extractChaptersFromHtmlSections(html) : []
  const markdownSections = markdown ? extractChaptersFromMarkdown(markdown) : []
  const chapters: StructuredChapter[] = []

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[chapters] sections detected | html:",
      htmlSections.length,
      "markdown:",
      markdownSections.length
    )
  }

  const preface = mergeChapterSections(
    html ? extractPrefaceFromHtml(html) : null,
    markdown ? extractPrefaceFromMarkdown(markdown) : null,
    "Introducción"
  )

  if (preface) {
    chapters.push(preface)
  }

  const count = Math.max(htmlSections.length, markdownSections.length)

  for (let i = 0; i < count; i++) {
    const merged = mergeChapterSections(
      htmlSections[i],
      markdownSections[i],
      `Sección ${chapters.length + 1}`
    )
    if (merged) {
      chapters.push(merged)
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[chapters] final chapter titles:",
      chapters.map((chapter) => chapter.title)
    )
  }

  return chapters
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
      chapters: buildStructuredChapters(styledHtml, markdownResult?.markdown),
    }
  } catch (error) {
    throw new Error(
      `Document import failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
