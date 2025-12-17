/**
 * Preview Builder
 * Constructs pages for preview from book data
 */

import { PaginationConfig } from './device-configs';

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

export type PageType = 'cover' | 'title' | 'content';

export interface PreviewPage {
  type: PageType;
  content: string | null;
  coverData?: CoverData;
  chapterTitle?: string;
  pageNumber?: number;
}

// ==================== MARKDOWN TO HTML CONVERTER ====================

/**
 * Lightweight markdown to HTML converter
 * Handles: headings, paragraphs, bold, italic, lists, images
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML tags first (except markdown images)
  const preservedImages: string[] = [];
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
    preservedImages.push(match);
    return `__IMAGE_PLACEHOLDER_${preservedImages.length - 1}__`;
  });

  // Convert markdown to HTML
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push('<br />');
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      processedLines.push(`<h${level}>${processInlineMarkdown(content)}</h${level}>`);
      continue;
    }

    // Unordered lists
    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${processInlineMarkdown(listMatch[1])}</li>`);
      continue;
    }

    // Ordered lists
    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      if (!inList) {
        processedLines.push('<ol>');
        inList = true;
      }
      processedLines.push(`<li>${processInlineMarkdown(orderedListMatch[1])}</li>`);
      continue;
    }

    // Regular paragraphs
    if (inList) {
      processedLines.push('</ul>');
      inList = false;
    }
    processedLines.push(`<p>${processInlineMarkdown(trimmed)}</p>`);
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Restore images and convert to HTML
  html = html.replace(/__IMAGE_PLACEHOLDER_(\d+)__/g, (_, index) => {
    const imageMarkdown = preservedImages[parseInt(index)];
    const match = imageMarkdown.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      const alt = match[1] || 'Image';
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
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code (`text`)
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');

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

  // Page 0: Cover page
  pages.push({
    type: 'cover',
    content: null,
    coverData: {
      title: book.title || 'Libro sin título',
      subtitle: book.subtitle,
      author: book.author || 'Autor desconocido',
      coverImage: book.coverImage,
      coverColor: book.coverColor || '#0088a0',
      coverLayout: book.coverLayout || 'centered',
      coverFont: book.coverFont || 'font-serif',
    },
  });

  // Page 1: Title page (optional - only if there's a subtitle or we want formal title page)
  if (book.subtitle) {
    const titlePageHtml = `
      <div class="title-page">
        <h1 class="title-page-title">${book.title || 'Libro sin título'}</h1>
        ${book.subtitle ? `<p class="title-page-subtitle">${book.subtitle}</p>` : ''}
        <p class="title-page-author">${book.author || 'Autor desconocido'}</p>
      </div>
    `;
    pages.push({
      type: 'title',
      content: titlePageHtml,
      pageNumber: 1,
    });
  }

  // Build content from manuscript and chapters
  let fullContent = '';

  // Add manuscript content if exists
  if (book.content?.trim()) {
    fullContent += book.content.trim() + '\n\n';
  }

  // Add chapters if they exist
  if (book.chapters && book.chapters.length > 0) {
    const sortedChapters = [...book.chapters].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    sortedChapters.forEach((chapter, index) => {
      const chapterTitle = chapter.title?.trim() || `Capítulo ${index + 1}`;
      const chapterBody = chapter.content?.trim() || '_Contenido aún no disponible_';
      fullContent += `## ${chapterTitle}\n\n${chapterBody}\n\n`;
    });
  }

  // If no content at all, add placeholder
  if (!fullContent.trim()) {
    fullContent = '_Todavía no hay contenido para previsualizar._';
  }

  // Convert markdown to HTML
  const contentHtml = convertMarkdownToHtml(fullContent);

  // Paginate content into multiple pages
  if (typeof window !== 'undefined') {
    // Client-side: use actual DOM measurement for accurate pagination
    try {
      const { paginateContentWithMeasurement } = require('./content-paginator');
      const contentPages = paginateContentWithMeasurement(contentHtml, config, document.body);
      pages.push(...contentPages.map((page, idx) => ({
        ...page,
        pageNumber: pages.length + idx,
      })));
    } catch (error) {
      // Fallback: single page if measurement fails
      console.warn('Pagination measurement failed, using single page:', error);
      pages.push({
        type: 'content' as const,
        content: contentHtml,
        pageNumber: pages.length,
      });
    }
  } else {
    // Server-side: use estimation-based pagination
    const { paginateContent } = require('./content-paginator');
    const contentPages = paginateContent(contentHtml, config);
    pages.push(...contentPages.map((page, idx) => ({
      ...page,
      pageNumber: pages.length + idx,
    })));
  }

  return pages;
}

/**
 * Extract chapter titles from content for TOC
 */
export function extractChapterTitles(content: string): Array<{ title: string; level: number }> {
  const chapters: Array<{ title: string; level: number }> = [];
  const lines = content.split('\n');

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
