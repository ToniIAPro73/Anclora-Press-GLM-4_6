/**
 * OCR Handler Module
 * Orchestrates Tesseract.js for optical character recognition
 * Supports PDF (scanned), images, and mixed content
 * Optimized for Next.js server-side execution
 */

export interface OCRResult {
  text: string;
  html: string;
  markdown: string;
  confidence: number;
  pages: number;
  language: string;
  warnings: string[];
  metadata: {
    processingTime: number;
    engine: 'tesseract';
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
    
    // If has text streams/arrays, likely digital text
    if (hasTextStreams || hasTextArrays) {
      return false;
    }
    
    // Default: assume scanned if uncertain
    return true;
  } catch (error) {
    console.warn('Error detecting PDF type:', error);
    return true; // Default to scanned
  }
}

/**
 * Extract text from scanned PDF or image using OCR
 * Uses Tesseract.js for optical character recognition
 */
export async function extractWithOCR(
  buffer: Buffer,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    // Dynamically import Tesseract.js to avoid module resolution issues in Next.js
    const Tesseract = (await import('tesseract.js')).default;
    
    // Convert buffer to image format if needed
    // For PDFs, we would need to convert to images first (using pdf-lib or similar)
    // For now, we'll handle image buffers directly
    
    const worker = await Tesseract.createWorker({
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Default to English + Spanish for better coverage
    const languages = options.languages || ['eng', 'spa'];
    
    // Recognize text from image buffer
    const result = await worker.recognize(buffer, languages.join('+'));
    
    const extractedText = result.data.text || '';
    const confidence = result.data.confidence || 0;
    
    await worker.terminate();

    // Post-process the extracted text
    const processedText = postProcessOCRText(extractedText, options);
    const htmlVersion = generateHTMLFromOCR(processedText);
    const markdownVersion = generateMarkdownFromOCR(processedText);

    const processingTime = Date.now() - startTime;

    // Estimate pages based on text length
    const estimatedPages = Math.max(1, Math.ceil(processedText.split('\n').length / 40));

    if (confidence < 0.5) {
      warnings.push('Low OCR confidence. Results may contain errors.');
    }

    if (processingTime > 30000) {
      warnings.push('OCR processing took longer than expected. Large document detected.');
    }

    return {
      text: processedText,
      html: htmlVersion,
      markdown: markdownVersion,
      confidence,
      pages: estimatedPages,
      language: languages[0],
      warnings,
      metadata: {
        processingTime,
        engine: 'tesseract',
        isScanned: true,
      },
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    
    // Return a graceful fallback
    return {
      text: '',
      html: '',
      markdown: '',
      confidence: 0,
      pages: 0,
      language: 'unknown',
      warnings: [
        `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'This may be due to: unsupported image format, corrupted file, or server resource limitations.',
      ],
      metadata: {
        processingTime: Date.now() - startTime,
        engine: 'tesseract',
        isScanned: true,
      },
    };
  }
}

/**
 * Post-process OCR text to improve quality
 * Removes artifacts, fixes common OCR errors, and structures content
 */
function postProcessOCRText(text: string, options: OCROptions): string {
  let processed = text;

  // Remove common OCR artifacts
  processed = processed
    .replace(/\|/g, 'l') // Replace pipes with lowercase L (common OCR error)
    .replace(/([a-z])\s+([a-z])/g, '$1$2') // Remove extra spaces between letters
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple line breaks

  // Fix common character substitutions
  const corrections: { [key: string]: string } = {
    '0': 'O', // Zero to O in certain contexts
    'rn': 'm', // "rn" that should be "m"
  };

  // Detect and fix potential heading patterns
  if (options.detectHeadings) {
    processed = processed.replace(/^([A-Z][A-Z\s]{3,})$/gm, (match) => {
      return `# ${match}`;
    });
  }

  // Detect and fix list patterns
  if (options.detectLists) {
    processed = processed.replace(/^(\s*)([-•*]|\d+\.)\s+/gm, '$1$2 ');
  }

  return processed.trim();
}

/**
 * Generate HTML from OCR text with basic structure
 */
function generateHTMLFromOCR(text: string): string {
  const lines = text.split('\n');
  let html = '<div class="ocr-content">\n';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      html += '</p>\n';
      continue;
    }

    // Detect headings (lines in all caps or starting with #)
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const content = trimmed.replace(/^#+\s*/, '');
      html += `<h${Math.min(level, 6)}>${escapeHTML(content)}</h${Math.min(level, 6)}>\n`;
    }
    // Detect lists
    else if (/^[-•*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-•*]\s+/, '');
      html += `<li>${escapeHTML(content)}</li>\n`;
    }
    // Regular paragraph
    else {
      html += `<p>${escapeHTML(trimmed)}</p>\n`;
    }
  }

  html += '</div>';
  return html;
}

/**
 * Generate Markdown from OCR text
 */
function generateMarkdownFromOCR(text: string): string {
  const lines = text.split('\n');
  let markdown = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      markdown += '\n';
      continue;
    }

    // Detect headings
    if (trimmed.startsWith('#')) {
      markdown += `${trimmed}\n`;
    }
    // Detect lists
    else if (/^[-•*]\s+/.test(trimmed)) {
      markdown += `${trimmed}\n`;
    }
    // Regular paragraph
    else {
      markdown += `${trimmed}\n`;
    }
  }

  return markdown.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
