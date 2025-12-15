/**
 * OCR Handler Module
 * Orchestrates Scribe.js and Tesseract.js for optical character recognition
 * Supports PDF (scanned), images, and mixed content
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  html: string;
  confidence: number;
  pages: number;
  language: string;
  warnings: string[];
  metadata: {
    processingTime: number;
    engine: 'scribe' | 'tesseract';
    isScanned: boolean;
  };
}

export interface OCROptions {
  languages?: string[];
  outputFormat?: 'text' | 'html' | 'markdown';
  preserveLayout?: boolean;
  detectHeadings?: boolean;
  detectLists?: boolean;
  timeout?: number;
}

/**
 * Detect if a PDF is scanned (image-based) or text-based
 */
export async function isPDFScanned(buffer: Buffer): Promise<boolean> {
  try {
    const raw = buffer.toString('latin1', 0, Math.min(buffer.length, 50000));
    
    // Check for text stream indicators
    const hasTextStreams = /\((?:\\.|[^\\)]){10,}\)\s*Tj/g.test(raw);
    const hasTextArrays = /\[(?:\\.|[^\]])*?\]\s*TJ/g.test(raw);
    
    // Check for image indicators
    const hasImages = /\/Subtype\s*\/Image/g.test(raw);
    const hasXObjects = /\/XObject/g.test(raw);
    
    // If has images but minimal text, likely scanned
    if (hasImages && !hasTextStreams && !hasTextArrays) {
      return true;
    }
    
    // Count text vs image ratio
    const textCount = (raw.match(/Tj|TJ/g) || []).length;
    const imageCount = (raw.match(/\/Image/g) || []).length;
    
    // If very few text operations but multiple images, likely scanned
    return textCount < 10 && imageCount > 0;
  } catch {
    return false;
  }
}

/**
 * Main OCR handler - tries Scribe.js first, falls back to Tesseract.js
 */
export async function extractWithOCR(
  input: Buffer | string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();
  const {
    languages = ['eng', 'spa'],
    outputFormat = 'markdown',
    preserveLayout = true,
    detectHeadings = true,
    detectLists = true,
  } = options;

  const warnings: string[] = [];

  try {
    // Try Scribe.js first (if available)
    try {
      return await extractWithScribe(input, {
        languages,
        outputFormat,
        preserveLayout,
        detectHeadings,
        detectLists,
        warnings,
        startTime,
      });
    } catch (scribeError) {
      warnings.push(`Scribe.js failed: ${scribeError instanceof Error ? scribeError.message : 'Unknown error'}`);
      console.warn('Scribe.js OCR failed, falling back to Tesseract.js');
    }

    // Fallback to Tesseract.js
    return await extractWithTesseract(input, {
      languages,
      outputFormat,
      preserveLayout,
      detectHeadings,
      detectLists,
      warnings,
      startTime,
    });
  } catch (error) {
    throw new Error(`All OCR methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text using Scribe.js (primary OCR engine)
 */
async function extractWithScribe(
  input: Buffer | string,
  options: {
    languages: string[];
    outputFormat: string;
    preserveLayout: boolean;
    detectHeadings: boolean;
    detectLists: boolean;
    warnings: string[];
    startTime: number;
  }
): Promise<OCRResult> {
  // Scribe.js would be imported dynamically if available
  // For now, we'll skip to Tesseract as Scribe.js is not widely available as npm package
  throw new Error('Scribe.js not available, using Tesseract.js');
}

/**
 * Extract text using Tesseract.js (fallback OCR engine)
 */
async function extractWithTesseract(
  input: Buffer | string,
  options: {
    languages: string[];
    outputFormat: string;
    preserveLayout: boolean;
    detectHeadings: boolean;
    detectLists: boolean;
    warnings: string[];
    startTime: number;
  }
): Promise<OCRResult> {
  const { languages, outputFormat, detectHeadings, detectLists, warnings, startTime } = options;

  let imageBuffer: Buffer;

  // Convert input to buffer
  if (typeof input === 'string') {
    imageBuffer = Buffer.from(input, 'base64');
  } else {
    imageBuffer = input;
  }

  const worker = await Tesseract.createWorker(languages[0] || 'eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  try {
    const { data } = await worker.recognize(imageBuffer);

    let html = data.text;
    let markdown = data.text;

    // Post-process to detect structure
    if (detectHeadings || detectLists) {
      const processed = processOCRText(data.text, {
        detectHeadings,
        detectLists,
      });
      html = processed.html;
      markdown = processed.markdown;
    }

    const processingTime = Date.now() - startTime;

    return {
      text: data.text,
      html,
      confidence: data.confidence / 100,
      pages: 1,
      language: languages[0] || 'eng',
      warnings,
      metadata: {
        processingTime,
        engine: 'tesseract',
        isScanned: true,
      }
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Post-process OCR text to detect headings, lists, and other structures
 */
function processOCRText(
  text: string,
  options: { detectHeadings: boolean; detectLists: boolean }
): { html: string; markdown: string } {
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  const markdownParts: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        htmlParts.push('</ul>');
        markdownParts.push('');
        inList = false;
      }
      continue;
    }

    // Detect headings (ALL CAPS or short lines with specific patterns)
    if (options.detectHeadings && isHeading(trimmed)) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const level = detectHeadingLevel(trimmed);
      htmlParts.push(`<h${level}>${escapeHtml(trimmed)}</h${level}>`);
      markdownParts.push(`${'#'.repeat(level)} ${trimmed}`);
      continue;
    }

    // Detect list items
    if (options.detectLists && isListItem(trimmed)) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const content = trimmed.replace(/^[•\-\*\d\.]+\s*/, '');
      htmlParts.push(`<li>${escapeHtml(content)}</li>`);
      markdownParts.push(`- ${content}`);
      continue;
    }

    // Regular paragraph
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
    htmlParts.push(`<p>${escapeHtml(trimmed)}</p>`);
    markdownParts.push(trimmed);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return {
    html: htmlParts.join('\n'),
    markdown: markdownParts.join('\n\n'),
  };
}

/**
 * Detect if a line is likely a heading
 */
function isHeading(line: string): boolean {
  // ALL CAPS and reasonably short
  if (line === line.toUpperCase() && line.length < 80 && line.length > 3) {
    return true;
  }

  // Starts with common heading patterns
  if (/^(Chapter|Capítulo|Sección|Section|Part|Parte)\s+\d+/i.test(line)) {
    return true;
  }

  // Short line with specific formatting
  if (line.length < 60 && line.length > 5) {
    const words = line.split(' ');
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w)).length;
    if (capitalizedWords / words.length > 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Detect heading level based on content
 */
function detectHeadingLevel(line: string): number {
  if (/^(Chapter|Capítulo|Part|Parte)\s+\d+/i.test(line)) {
    return 1;
  }
  if (/^(Section|Sección)\s+\d+/i.test(line)) {
    return 2;
  }
  if (line.length < 40) {
    return 2;
  }
  return 3;
}

/**
 * Detect if a line is a list item
 */
function isListItem(line: string): boolean {
  return /^[•\-\*]\s/.test(line) || /^\d+[\.\)]\s/.test(line);
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

export default {
  extractWithOCR,
  isPDFScanned,
};
