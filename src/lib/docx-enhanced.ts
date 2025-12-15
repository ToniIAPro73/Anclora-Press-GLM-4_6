/**
 * Enhanced DOCX Parser Module
 * Extends Mammoth.js with advanced style detection and semantic preservation
 */

import mammoth from 'mammoth';

export interface DOCXResult {
  html: string;
  markdown: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  warnings: string[];
  statistics: {
    wordCount: number;
    paragraphCount: number;
    headingCount: number;
    listCount: number;
    tableCount: number;
  };
}

/**
 * Parse DOCX file with enhanced style mapping
 */
export async function parseDOCXEnhanced(buffer: Buffer): Promise<DOCXResult> {
  const warnings: string[] = [];

  try {
    // Create enhanced style map
    const styleMap = createEnhancedStyleMap();

    // Convert DOCX to HTML using Mammoth
    const result = await mammoth.convertToHtml(
      { buffer },
      { styleMap }
    );

    // Extract metadata
    const metadata = extractMetadata(result);

    // Convert HTML to Markdown
    const markdown = htmlToMarkdown(result.value);

    // Calculate statistics
    const statistics = calculateStatistics(result.value);

    return {
      html: result.value,
      markdown,
      metadata,
      warnings: [...warnings, ...result.messages.map(m => m.message)],
      statistics,
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create enhanced style map for Mammoth.js
 * Maps Word styles to semantic HTML tags
 */
function createEnhancedStyleMap(): string[] {
  return [
    // Heading styles
    'p[style-name="Heading 1"] => h1:fresh',
    'p[style-name="Heading 2"] => h2:fresh',
    'p[style-name="Heading 3"] => h3:fresh',
    'p[style-name="Heading 4"] => h4:fresh',
    'p[style-name="Heading 5"] => h5:fresh',
    'p[style-name="Heading 6"] => h6:fresh',
    'p[style-name="Título"] => h1:fresh',
    'p[style-name="Título 1"] => h1:fresh',
    'p[style-name="Subtítulo"] => h2:fresh',
    'p[style-name="Capítulo"] => h1:fresh',
    'p[style-name="Sección"] => h2:fresh',

    // Body text styles
    'p[style-name="Normal"] => p:fresh',
    'p[style-name="Párrafo"] => p:fresh',
    'p[style-name="Cuerpo de texto"] => p:fresh',
    'p[style-name="Body Text"] => p:fresh',

    // Quote and blockquote styles
    'p[style-name="Quote"] => blockquote:fresh',
    'p[style-name="Cita"] => blockquote:fresh',
    'p[style-name="Block Text"] => blockquote:fresh',

    // List styles
    'p[style-name="List Bullet"] => ul > li:fresh',
    'p[style-name="List Number"] => ol > li:fresh',
    'p[style-name="Lista con viñetas"] => ul > li:fresh',
    'p[style-name="Lista numerada"] => ol > li:fresh',

    // Table styles
    'table => table:fresh',
    'tr => tr:fresh',
    'td => td:fresh',
    'th => th:fresh',

    // Emphasis styles
    'r[style-name="Énfasis"] => em',
    'r[style-name="Énfasis intenso"] => strong',
    'r[style-name="Fuerte"] => strong',

    // Code and technical styles
    'p[style-name="Code"] => pre:fresh',
    'p[style-name="Código"] => pre:fresh',
    'r[style-name="Código de carácter"] => code',

    // Fallback for unknown styles (preserve as paragraph)
    'p => p:fresh',
    'r => span',
  ];
}

/**
 * Strip HTML tags from string
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&mdash;': '—',
    '&ndash;': '–',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Extract metadata from DOCX document
 */
function extractMetadata(result: mammoth.Result<string>): {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
} {
  // Mammoth doesn't directly expose metadata, but we can extract from content
  // This is a basic implementation that could be enhanced
  const metadata: any = {};

  // Try to find title from first heading
  const h1Match = result.value.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1Match) {
    metadata.title = stripHtmlTags(h1Match[1]);
  }

  return metadata;
}

/**
 * Convert HTML to Markdown
 * Preserves document structure with proper heading hierarchy
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // STEP 1: Process complex nested structures FIRST
  // Handle blockquotes with nested content
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.split(/\n/).map((line: string) => '> ' + line.trim()).join('\n');
    return lines + '\n\n';
  });

  // Handle code blocks
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '');
    return '```\n' + cleanContent + '\n```\n\n';
  });

  // STEP 2: Convert heading tags (MUST be before paragraph conversion)
  // Process h1-h6 tags, handling nested formatting
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '# ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '## ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '#### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '##### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '###### ' + text.trim() + '\n\n';
  });

  // STEP 3: Handle lists (before paragraph conversion)
  // Unordered lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((item: string) => {
      const text = stripHtmlTags(item).trim();
      return '- ' + text;
    }).join('\n') + '\n\n';
  });

  // Ordered lists
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((item: string, index: number) => {
      const text = stripHtmlTags(item).trim();
      return (index + 1) + '. ' + text;
    }).join('\n') + '\n\n';
  });

  // STEP 4: Convert inline formatting (bold, italic, etc.)
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__');
  markdown = markdown.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');

  // STEP 5: Convert paragraph tags
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
    const text = stripHtmlTags(content).trim();
    return text ? text + '\n\n' : '';
  });

  // STEP 6: Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // STEP 7: Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // STEP 8: Decode HTML entities
  markdown = decodeHtmlEntities(markdown);

  // STEP 9: Clean up whitespace
  markdown = markdown.replace(/\n\n+/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * Calculate statistics from HTML content
 */
function calculateStatistics(html: string): {
  wordCount: number;
  paragraphCount: number;
  headingCount: number;
  listCount: number;
  tableCount: number;
} {
  const plainText = stripHtmlTags(html);
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const paragraphCount = (html.match(/<p[^>]*>/gi) || []).length;
  const headingCount = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  const listCount = (html.match(/<li[^>]*>/gi) || []).length;
  const tableCount = (html.match(/<table[^>]*>/gi) || []).length;

  return {
    wordCount,
    paragraphCount,
    headingCount,
    listCount,
    tableCount,
  };
}

const docxEnhanced = {
  parseDOCXEnhanced,
};

export default docxEnhanced;
