import pdf2md from '@opendocsg/pdf2md';
import { extractText, getDocumentProxy } from 'unpdf';
import { Buffer } from 'buffer';

interface PdfExtractionResult {
  text: string;
  html: string;
  markdown: string;
  estimatedPages?: number;
  warnings?: string[];
  metadata?: {
    title?: string;
    author?: string;
    createdDate?: string;
  };
}

/**
 * Convierte Markdown a HTML simple para el editor.
 * @param markdown 
 * @returns 
 */
function markdownToHtml(markdown: string): string {
  // Implementación simple de conversión de Markdown a HTML
  let html = markdown;

  // Convertir encabezados
  html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Convertir listas (simple)
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

  // Convertir párrafos
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<h') || p.startsWith('<ul')) return p;
    return `<p>${p}</p>`;
  }).join('');

  return html;
}

/**
 * Extrae contenido de PDF usando la mejor heurística disponible.
 * Prioridad: @opendocsg/pdf2md (estructura) -> unpdf (texto plano)
 * @param buffer 
 * @returns 
 */
export async function extractPdfContentEnhanced(buffer: Buffer): Promise<PdfExtractionResult> {
  const warnings: string[] = [];
  let markdown = '';
  let html = '';
  let parserUsed = '';

  // Nivel 1: @opendocsg/pdf2md (Mejor opción para estructura heurística)
  try {
    // pdf2md espera un Uint8Array
    markdown = await pdf2md(new Uint8Array(buffer));
    parserUsed = '@opendocsg/pdf2md';
  } catch (e) {
    warnings.push(`pdf2md falló: ${e.message}. Intentando con unpdf.`);
    
      // Nivel 2: unpdf (Texto plano)
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      // Intentar extraer texto de todas las páginas
      const { text } = await extractText(pdf, { mergePages: true });
      
      if (text.trim()) {
        markdown = text;
        parserUsed = 'unpdf';
        warnings.push('Se usó unpdf. La estructura (headings, listas) puede ser limitada.');
      } else {
        // Si la extracción de texto plano falla, lanzar un error para el fallo total
        throw new Error('unpdf extracted empty content.');
      }
    } catch (e2) {
      warnings.push(`unpdf falló: ${e2.message}. Fallo total de extracción.`);
      throw new Error('All PDF parsers failed to extract content.');
    }
  }

  if (!markdown.trim()) {
    throw new Error('Extracted content is empty.');
  }

  // Convertir el markdown extraído a HTML para el editor
  html = markdownToHtml(markdown);

  // Estimación de páginas (simple)
  const estimatedPages = Math.ceil(markdown.split(/\s+/).filter(w => w.length > 0).length / 200);

  return {
    text: markdown,
    markdown: markdown,
    html: html,
    estimatedPages: estimatedPages,
    warnings: warnings,
    metadata: {
      title: '', // pdf2md no extrae metadatos fácilmente, se deja vacío
      author: '',
    },
  };
}
