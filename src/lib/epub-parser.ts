/**
 * EPUB Parser Module
 * Extracts content from EPUB files while preserving structure and metadata
 */

import JSZip from 'jszip';

export interface EPUBMetadata {
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  date?: string;
  description?: string;
}

export interface EPUBContent {
  metadata: EPUBMetadata;
  chapters: EPUBChapter[];
  html: string;
  markdown: string;
  warnings: string[];
}

export interface EPUBChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

/**
 * Parse EPUB file and extract content
 */
export async function parseEPUB(buffer: Buffer): Promise<EPUBContent> {
  const warnings: string[] = [];

  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);

    // Extract metadata
    const metadata = await extractMetadata(zipContent, warnings);

    // Extract chapters
    const chapters = await extractChapters(zipContent, warnings);

    // Generate HTML and Markdown
    const html = generateHTML(metadata, chapters);
    const markdown = generateMarkdown(metadata, chapters);

    return {
      metadata,
      chapters,
      html,
      markdown,
      warnings,
    };
  } catch (error) {
    throw new Error(`Failed to parse EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract metadata from EPUB opf file
 */
async function extractMetadata(zip: JSZip, warnings: string[]): Promise<EPUBMetadata> {
  const metadata: EPUBMetadata = {};

  try {
    // Find the OPF file (usually in META-INF/container.xml)
    const containerXml = zip.file('META-INF/container.xml');
    if (!containerXml) {
      warnings.push('No META-INF/container.xml found');
      return metadata;
    }

    const containerContent = await containerXml.async('string');
    const opfPath = extractOPFPath(containerContent);

    if (!opfPath) {
      warnings.push('Could not determine OPF file path');
      return metadata;
    }

    // Read OPF file
    const opfFile = zip.file(opfPath);
    if (!opfFile) {
      warnings.push(`OPF file not found at ${opfPath}`);
      return metadata;
    }

    const opfContent = await opfFile.async('string');
    const parsedMetadata = parseOPFMetadata(opfContent);

    return { ...metadata, ...parsedMetadata };
  } catch (error) {
    warnings.push(`Error extracting metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return metadata;
  }
}

/**
 * Extract OPF file path from container.xml
 */
function extractOPFPath(containerXml: string): string | null {
  const match = containerXml.match(/full-path="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * Parse metadata from OPF XML
 */
function parseOPFMetadata(opfContent: string): EPUBMetadata {
  const metadata: EPUBMetadata = {};

  // Simple regex-based parsing (for production, use proper XML parser)
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  if (titleMatch) metadata.title = titleMatch[1];

  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  if (authorMatch) metadata.author = authorMatch[1];

  const languageMatch = opfContent.match(/<dc:language[^>]*>([^<]+)<\/dc:language>/i);
  if (languageMatch) metadata.language = languageMatch[1];

  const publisherMatch = opfContent.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/i);
  if (publisherMatch) metadata.publisher = publisherMatch[1];

  const dateMatch = opfContent.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/i);
  if (dateMatch) metadata.date = dateMatch[1];

  const descriptionMatch = opfContent.match(/<dc:description[^>]*>([^<]+)<\/dc:description>/i);
  if (descriptionMatch) metadata.description = descriptionMatch[1];

  return metadata;
}

/**
 * Extract chapters from EPUB
 */
async function extractChapters(zip: JSZip, warnings: string[]): Promise<EPUBChapter[]> {
  const chapters: EPUBChapter[] = [];

  try {
    // Get list of XHTML files in OEBPS directory
    const oebpsFiles = Object.keys(zip.files).filter(
      (path) => path.includes('OEBPS/') && (path.endsWith('.xhtml') || path.endsWith('.html'))
    );

    // Sort files to maintain chapter order
    oebpsFiles.sort();

    for (let i = 0; i < oebpsFiles.length; i++) {
      const filePath = oebpsFiles[i];
      const file = zip.file(filePath);

      if (!file) continue;

      const content = await file.async('string');
      const title = extractChapterTitle(content) || `Chapter ${i + 1}`;
      const cleanContent = sanitizeHTML(content);

      chapters.push({
        id: `chapter-${i}`,
        title,
        content: cleanContent,
        order: i,
      });
    }
  } catch (error) {
    warnings.push(`Error extracting chapters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return chapters;
}

/**
 * Extract chapter title from XHTML content
 */
function extractChapterTitle(xhtml: string): string | null {
  // Try to find h1, h2, or title tag
  const h1Match = xhtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1];

  const h2Match = xhtml.match(/<h2[^>]*>([^<]+)<\/h2>/i);
  if (h2Match) return h2Match[1];

  const titleMatch = xhtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1];

  return null;
}

/**
 * Sanitize HTML content from EPUB
 */
function sanitizeHTML(html: string): string {
  // Remove script tags and event handlers
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');

  // Remove style tags but keep content
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');

  // Extract body content if present
  const bodyMatch = sanitized.match(/<body[^>]*>(.*?)<\/body>/is);
  if (bodyMatch) {
    sanitized = bodyMatch[1];
  }

  return sanitized;
}

/**
 * Generate HTML from EPUB content
 */
function generateHTML(metadata: EPUBMetadata, chapters: EPUBChapter[]): string {
  const htmlParts: string[] = [];

  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html>');
  htmlParts.push('<head>');
  htmlParts.push('<meta charset="UTF-8">');
  if (metadata.title) htmlParts.push(`<title>${escapeHtml(metadata.title)}</title>`);
  htmlParts.push('</head>');
  htmlParts.push('<body>');

  // Add metadata as header
  if (metadata.title) htmlParts.push(`<h1>${escapeHtml(metadata.title)}</h1>`);
  if (metadata.author) htmlParts.push(`<p><strong>Author:</strong> ${escapeHtml(metadata.author)}</p>`);
  if (metadata.description) htmlParts.push(`<p>${escapeHtml(metadata.description)}</p>`);

  htmlParts.push('<hr>');

  // Add chapters
  for (const chapter of chapters) {
    htmlParts.push(`<h2>${escapeHtml(chapter.title)}</h2>`);
    htmlParts.push(chapter.content);
    htmlParts.push('<hr>');
  }

  htmlParts.push('</body>');
  htmlParts.push('</html>');

  return htmlParts.join('\n');
}

/**
 * Generate Markdown from EPUB content
 */
function generateMarkdown(metadata: EPUBMetadata, chapters: EPUBChapter[]): string {
  const markdownParts: string[] = [];

  if (metadata.title) markdownParts.push(`# ${metadata.title}`);
  if (metadata.author) markdownParts.push(`**Author:** ${metadata.author}`);
  if (metadata.description) markdownParts.push(`\n${metadata.description}`);

  markdownParts.push('---\n');

  for (const chapter of chapters) {
    markdownParts.push(`## ${chapter.title}`);
    // Convert HTML to markdown (simple conversion)
    const markdown = htmlToMarkdown(chapter.content);
    markdownParts.push(markdown);
    markdownParts.push('---\n');
  }

  return markdownParts.join('\n');
}

/**
 * Simple HTML to Markdown converter
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Convert heading tags
  markdown = markdown.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1');

  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*');

  // Convert paragraph tags
  markdown = markdown.replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n');

  // Convert list items
  markdown = markdown.replace(/<li[^>]*>([^<]+)<\/li>/gi, '- $1\n');
  markdown = markdown.replace(/<ul[^>]*>|<\/ul>/gi, '');
  markdown = markdown.replace(/<ol[^>]*>|<\/ol>/gi, '');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  markdown = markdown.replace(/\n\n+/g, '\n\n');

  return markdown.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const epubParser = {
  parseEPUB,
};

export default epubParser;
