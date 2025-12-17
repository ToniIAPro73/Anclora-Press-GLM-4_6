/**
 * Preview Builder - FIXED VERSION
 * Constructs pages for preview from book data
 *
 * CHANGES:
 * 1. Removed title page (was redundant with cover)
 * 2. Added TOC page after cover
 * 3. Fixed page numbering
 */

import { PaginationConfig } from "./device-configs";

// ==================== TYPES ====================

export interface ChapterPreview {
  id?: string;
  title?: string;
  content?: string;
  order?: number;
  status?: string;
}

export interface BookData {
  title: string;
  subtitle: string;
  author: string;
  content: string;
  template: string;
  coverImage: string | null;
  coverColor: string;
  coverLayout?: string;
  coverFont?: string;
  genre: string;
  chapters?: ChapterPreview[];
}

export interface CoverData {
  title: string;
  subtitle?: string;
  author: string;
  coverImage: string | null;
  coverColor: string;
  coverLayout?: string;
  coverFont?: string;
}

export interface TOCEntry {
  title: string;
  pageNumber: number;
  level: number;
}

export type PageType = "cover" | "toc" | "content";

export interface PreviewPage {
  type: PageType;
  content: string | null;
  coverData?: CoverData;
  tocEntries?: TOCEntry[];
  chapterTitle?: string;
  pageNumber?: number;
}

// ==================== MARKDOWN TO HTML CONVERTER ====================

/**
 * Lightweight markdown to HTML converter
 * Handles: headings, paragraphs, bold, italic, lists, images
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Preserve images first
  const preservedImages: string[] = [];
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
    preservedImages.push(match);
    return `__IMAGE_PLACEHOLDER_${preservedImages.length - 1}__`;
  });

  // Convert markdown to HTML
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      continue; // Skip empty lines, don't add <br>
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      processedLines.push(
        `<h${level}>${processInlineMarkdown(content)}</h${level}>`
      );
      continue;
    }

    // Unordered lists
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unorderedMatch) {
      if (!inList || listType !== "ul") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ul>");
        inList = true;
        listType = "ul";
      }
      processedLines.push(
        `<li>${processInlineMarkdown(unorderedMatch[1])}</li>`
      );
      continue;
    }

    // Ordered lists
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!inList || listType !== "ol") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ol>");
        inList = true;
        listType = "ol";
      }
      processedLines.push(`<li>${processInlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    // Regular paragraphs
    if (inList) {
      processedLines.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
    processedLines.push(`<p>${processInlineMarkdown(trimmed)}</p>`);
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  html = processedLines.join("\n");

  // Restore images and convert to HTML
  html = html.replace(/__IMAGE_PLACEHOLDER_(\d+)__/g, (_, index) => {
    const imageMarkdown = preservedImages[parseInt(index)];
    const match = imageMarkdown.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      const alt = match[1] || "Image";
      const src = match[2];
      return `<img src="${src}" alt="${alt}" class="markdown-image" />`;
    }
    return imageMarkdown;
  });

  return html;
}

/**
 * Process inline markdown (bold, italic, code)
 */
function processInlineMarkdown(text: string): string {
  let result = text;

  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");

  // Code (`text`)
  result = result.replace(/`(.+?)`/g, "<code>$1</code>");

  // Links [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return result;
}

// ==================== PAGE BUILDER ====================

/**
 * Build preview pages from book data
 */
export function buildPreviewPages(
  book: BookData,
  config: PaginationConfig
): PreviewPage[] {
  const pages: PreviewPage[] = [];

  // ─────────────────────────────────────────────────────────────
  // PAGE 1: COVER (Portada)
  // ─────────────────────────────────────────────────────────────
  pages.push({
    type: "cover",
    content: null,
    coverData: {
      title: book.title || "Libro sin título",
      subtitle: book.subtitle,
      author: book.author || "Autor desconocido",
      coverImage: book.coverImage,
      coverColor: book.coverColor || "#0088a0",
      coverLayout: book.coverLayout || "centered",
      coverFont: book.coverFont || "font-serif",
    },
    pageNumber: 1,
  });

  // ─────────────────────────────────────────────────────────────
  // BUILD CONTENT STRUCTURE (for TOC and content pages)
  // ─────────────────────────────────────────────────────────────

  // Collect all content sections
  interface ContentSection {
    title: string;
    content: string;
    isChapter: boolean;
    chapterNumber?: number;
  }

  const sections: ContentSection[] = [];

  // Add manuscript content (preámbulo) if exists
  if (book.content?.trim()) {
    sections.push({
      title: "Preámbulo",
      content: book.content.trim(),
      isChapter: false,
    });
  }

  // Add chapters
  if (book.chapters && book.chapters.length > 0) {
    const sortedChapters = [...book.chapters].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    sortedChapters.forEach((chapter, index) => {
      const chapterTitle = chapter.title?.trim() || `Capítulo ${index + 1}`;
      const chapterBody =
        chapter.content?.trim() || "_Contenido aún no disponible_";

      sections.push({
        title: chapterTitle,
        content: chapterBody,
        isChapter: true,
        chapterNumber: index + 1,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PAGE 2: TABLE OF CONTENTS (Índice)
  // ─────────────────────────────────────────────────────────────

  // Calculate page numbers for TOC
  // Page 1 = Cover, Page 2 = TOC, Page 3+ = Content
  const tocEntries: TOCEntry[] = [];
  let currentPageNumber = 3; // Content starts at page 3

  sections.forEach((section) => {
    tocEntries.push({
      title: section.title,
      pageNumber: currentPageNumber,
      level: section.isChapter ? 1 : 0, // Level 0 for preámbulo, 1 for chapters
    });

    // Estimate pages per section (rough: 1 page per 2000 chars)
    const estimatedPages = Math.max(
      1,
      Math.ceil(section.content.length / 2000)
    );
    currentPageNumber += estimatedPages;
  });

  // Generate TOC HTML
  const tocHtml = generateTOCHtml(tocEntries, book.title);

  pages.push({
    type: "toc",
    content: tocHtml,
    tocEntries: tocEntries,
    pageNumber: 2,
  });

  // ─────────────────────────────────────────────────────────────
  // PAGE 3+: CONTENT PAGES
  // ─────────────────────────────────────────────────────────────

  // Build full content markdown
  let fullContent = "";

  sections.forEach((section) => {
    if (section.isChapter) {
      // Chapter heading (H2)
      fullContent += `## ${section.title}\n\n${section.content}\n\n`;
    } else {
      // Preámbulo - no heading, just content
      fullContent += `${section.content}\n\n`;
    }
  });

  // If no content at all, add placeholder
  if (!fullContent.trim()) {
    fullContent = "_Todavía no hay contenido para previsualizar._";
  }

  // Convert markdown to HTML
  const contentHtml = convertMarkdownToHtml(fullContent);

  // Add single content page (will be paginated by content-paginator)
  pages.push({
    type: "content",
    content: contentHtml,
    pageNumber: 3,
  });

  return pages;
}

/**
 * Generate HTML for Table of Contents page
 */
function generateTOCHtml(entries: TOCEntry[], bookTitle: string): string {
  const entriesHtml = entries
    .map((entry) => {
      const indentClass = entry.level === 0 ? "toc-preface" : "toc-chapter";
      const prefix = entry.level > 0 ? "" : "";

      return `
      <div class="toc-entry ${indentClass}">
        <span class="toc-title">${prefix}${entry.title}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${entry.pageNumber}</span>
      </div>
    `;
    })
    .join("");

  return `
    <div class="toc-page">
      <h2 class="toc-heading">Índice</h2>
      <div class="toc-entries">
        ${entriesHtml}
      </div>
    </div>
    <style>
      .toc-page {
        padding: 2rem;
      }
      .toc-heading {
        text-align: center;
        font-size: 1.5rem;
        margin-bottom: 2rem;
        font-weight: bold;
        border-bottom: 1px solid #ccc;
        padding-bottom: 1rem;
      }
      .toc-entries {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .toc-entry {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
      }
      .toc-title {
        white-space: nowrap;
      }
      .toc-dots {
        flex: 1;
        border-bottom: 1px dotted #999;
        margin: 0 0.5rem;
        min-width: 2rem;
      }
      .toc-page {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .toc-preface {
        font-style: italic;
      }
      .toc-chapter {
        font-weight: 500;
      }
    </style>
  `;
}

/**
 * Extract chapter titles from content for TOC sidebar
 */
export function extractChapterTitles(
  content: string
): Array<{ title: string; level: number }> {
  const chapters: Array<{ title: string; level: number }> = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      chapters.push({ title, level });
    }
  }

  return chapters;
}

/**
 * Get chapter count from book data
 */
export function getChapterCount(book: BookData): number {
  return book.chapters?.length ?? 0;
}

/**
 * Build TOC entries for sidebar from book data
 */
export function buildTOCForSidebar(book: BookData): TOCEntry[] {
  const entries: TOCEntry[] = [];

  // Cover
  entries.push({
    title: "Portada",
    pageNumber: 1,
    level: 0,
  });

  // TOC page
  entries.push({
    title: "Índice",
    pageNumber: 2,
    level: 0,
  });

  // Preámbulo if exists
  let currentPage = 3;
  if (book.content?.trim()) {
    entries.push({
      title: "Preámbulo",
      pageNumber: currentPage,
      level: 0,
    });
    currentPage++;
  }

  // Chapters
  if (book.chapters && book.chapters.length > 0) {
    const sortedChapters = [...book.chapters].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    sortedChapters.forEach((chapter, index) => {
      const chapterTitle = chapter.title?.trim() || `Capítulo ${index + 1}`;
      entries.push({
        title: chapterTitle,
        pageNumber: currentPage,
        level: 1,
      });
      currentPage++;
    });
  }

  return entries;
}
