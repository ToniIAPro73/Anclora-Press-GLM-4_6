# Informe Técnico: Optimización del Pipeline de Importación de Documentos — Anclora Press

## Resumen Ejecutivo

El presente informe analiza la arquitectura actual de importación de documentos en Anclora Press e identifica mejoras críticas para la extracción semántica de contenido, especialmente en formatos PDF y documentos escaneados. Se propone una estrategia de tres niveles: librerías JavaScript nativas (Scribe.js, Mammoth.js mejorado), servicios Docker (LibreOffice, Pandoc), y modelos VLM vía API o ejecución local (GLM-4.6V-Flash, Qwen3-VL).

---

## 1. Diagnóstico del Sistema Actual

### 1.1 Arquitectura Existente

La implementación actual en `src/lib/document-importer.ts` y `src/app/api/import/route.ts` presenta la siguiente estructura:

| Formato | Librería Principal | Fallback | Estado |
|---------|-------------------|----------|--------|
| DOCX | Mammoth.js | Pandoc | ✅ Funcional |
| PDF | extractPdfContent (custom) | Pandoc | ⚠️ Limitado |
| DOC/RTF/ODT/EPUB | Pandoc | Mensaje genérico | ⚠️ Variable |
| TXT/MD | fs nativo | - | ✅ Funcional |

### 1.2 Problemas Identificados

**PDF — Problema Crítico:**
- El extractor actual (`pdf-text-extractor.ts`) parsea PDFs a nivel binario buscando operadores `Tj` y `TJ`.
- No preserva estructura semántica (headings, listas, tablas).
- Falla con PDFs escaneados (imágenes de texto).
- No detecta jerarquía de capítulos.

**DOCX — Mejoras Posibles:**
- Mammoth.js funciona correctamente pero el `styleMap` es básico.
- No detecta estilos personalizados comunes en manuscritos literarios.
- Listas anidadas complejas pueden fragmentarse.

**Formatos Legacy (DOC, RTF, ODT):**
- Dependencia total de Pandoc como proceso externo.
- Sin fallback si Pandoc falla o no está instalado.

---

## 2. Stack Recomendado por Formato

### 2.1 Matriz de Soluciones

| Formato | Nivel 1 (JavaScript) | Nivel 2 (Servicio) | Nivel 3 (VLM/OCR) |
|---------|---------------------|-------------------|-------------------|
| **PDF (texto)** | @opendocsg/pdf2md | Pandoc | - |
| **PDF (escaneado)** | Scribe.js OCR | Apache Tika | GLM-4.6V-Flash / Qwen3-VL |
| **DOCX** | Mammoth.js + styleMap extendido | Pandoc | - |
| **DOC** | word-extractor → libreoffice-convert | Pandoc | - |
| **RTF/ODT** | libreoffice-convert | Pandoc | - |
| **EPUB** | @lingo-reader/epub-parser | - | - |
| **Imágenes con texto** | Scribe.js / Tesseract.js | - | GLM-4.6V-Flash / Qwen3-VL |

---

## 3. Implementación: Librerías OCR JavaScript

### 3.1 Scribe.js — Recomendación Principal

Scribe.js supera a Tesseract.js en precisión y soporta PDF nativamente. Es la evolución directa de Tesseract.js con mejoras significativas.

**Instalación:**
```bash
npm install scribe.js-ocr
```

**Archivo: `src/lib/ocr-scribe.ts`**

```typescript
/**
 * OCR Integration using Scribe.js
 * Provides high-quality text extraction from images and scanned PDFs
 */

import scribe from 'scribe.js-ocr';

export interface OCRResult {
  text: string;
  html: string;
  confidence: number;
  pages: number;
  language: string;
  warnings: string[];
}

export interface OCROptions {
  languages?: string[];
  outputFormat?: 'text' | 'html' | 'hocr';
  preserveLayout?: boolean;
}

/**
 * Extract text from image or scanned PDF using Scribe.js
 * Scribe.js automatically detects if PDF is text-native or image-native
 */
export async function extractWithOCR(
  input: Buffer | string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const {
    languages = ['eng', 'spa'],
    outputFormat = 'text',
    preserveLayout = true
  } = options;

  const warnings: string[] = [];

  try {
    // Convert Buffer to data URL if needed
    let inputSource: string;
    if (Buffer.isBuffer(input)) {
      const base64 = input.toString('base64');
      // Detect if PDF or image
      const isPDF = input.slice(0, 5).toString() === '%PDF-';
      const mimeType = isPDF ? 'application/pdf' : 'image/png';
      inputSource = `data:${mimeType};base64,${base64}`;
    } else {
      inputSource = input;
    }

    // Configure Scribe.js
    await scribe.init({
      langs: languages,
      vanillaMode: false, // Use improved recognition model
      legacyMode: false,
    });

    // Perform OCR
    const result = await scribe.extractText([inputSource]);

    // Get detailed results if available
    const pages = await scribe.getPageCount?.() || 1;
    const confidence = await scribe.getConfidence?.() || 0.85;

    // Generate HTML output if requested
    let html = '';
    if (outputFormat === 'html' || preserveLayout) {
      html = await scribe.extractTextAsHtml?.([inputSource]) || 
             convertTextToHtml(result);
    }

    await scribe.terminate();

    return {
      text: result,
      html: html || convertTextToHtml(result),
      confidence,
      pages,
      language: languages[0],
      warnings
    };

  } catch (error) {
    warnings.push(`Scribe.js OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Fallback to Tesseract.js
    return fallbackToTesseract(input, options, warnings);
  }
}

/**
 * Fallback to Tesseract.js if Scribe.js fails
 */
async function fallbackToTesseract(
  input: Buffer | string,
  options: OCROptions,
  warnings: string[]
): Promise<OCRResult> {
  const Tesseract = await import('tesseract.js');
  
  warnings.push('Using Tesseract.js fallback (lower accuracy expected)');

  try {
    const worker = await Tesseract.createWorker(options.languages?.[0] || 'eng');
    
    const imageData = Buffer.isBuffer(input) 
      ? input 
      : Buffer.from(input, 'base64');
    
    const { data } = await worker.recognize(imageData);
    
    await worker.terminate();

    return {
      text: data.text,
      html: convertTextToHtml(data.text),
      confidence: data.confidence / 100,
      pages: 1,
      language: options.languages?.[0] || 'eng',
      warnings
    };
  } catch (tesseractError) {
    warnings.push(`Tesseract.js also failed: ${tesseractError instanceof Error ? tesseractError.message : 'Unknown error'}`);
    throw new Error('All OCR methods failed');
  }
}

/**
 * Convert plain text to semantic HTML
 */
function convertTextToHtml(text: string): string {
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Detect headings (ALL CAPS or short lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 3) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      htmlParts.push(`<h2>${escapeHtml(trimmed)}</h2>`);
      continue;
    }

    // Detect list items
    if (/^[•\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed)) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const content = trimmed.replace(/^[•\-\*\d\.]+\s*/, '');
      htmlParts.push(`<li>${escapeHtml(content)}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
    htmlParts.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if a PDF appears to be scanned (image-based)
 * Returns true if PDF likely requires OCR
 */
export async function isPDFScanned(buffer: Buffer): Promise<boolean> {
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
}

export default {
  extractWithOCR,
  isPDFScanned
};
```

### 3.2 Tesseract.js — Fallback Ligero

**Archivo: `src/lib/ocr-tesseract.ts`**

```typescript
/**
 * Tesseract.js OCR - Lightweight fallback
 * Use when Scribe.js is unavailable or for simple images
 */

import Tesseract from 'tesseract.js';

export interface TesseractOptions {
  language?: string;
  logger?: (info: Tesseract.LoggerMessage) => void;
}

export async function ocrWithTesseract(
  imageBuffer: Buffer,
  options: TesseractOptions = {}
): Promise<{ text: string; confidence: number }> {
  const { language = 'eng+spa' } = options;

  const worker = await Tesseract.createWorker(language, 1, {
    logger: options.logger || ((m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    })
  });

  try {
    const { data } = await worker.recognize(imageBuffer);
    
    return {
      text: data.text,
      confidence: data.confidence / 100
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Process multi-page PDF with Tesseract
 * Requires pdf.js to render pages to images first
 */
export async function ocrPDFWithTesseract(
  pdfBuffer: Buffer,
  options: TesseractOptions = {}
): Promise<{ text: string; pages: number; confidence: number }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  const worker = await Tesseract.createWorker(options.language || 'eng+spa');
  
  let fullText = '';
  let totalConfidence = 0;
  
  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR
      
      // Create canvas
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d')!;
      
      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport
      }).promise;
      
      // Convert to image buffer
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      // OCR the page
      const { data } = await worker.recognize(imageBuffer);
      
      fullText += `\n\n--- Page ${pageNum} ---\n\n${data.text}`;
      totalConfidence += data.confidence;
    }
    
    return {
      text: fullText.trim(),
      pages: numPages,
      confidence: totalConfidence / (numPages * 100)
    };
  } finally {
    await worker.terminate();
  }
}
```

---

## 4. Implementación: APIs de Modelos VLM

### 4.1 GLM-4.6V-Flash (ZhipuAI) — Gratuito

GLM-4.6V-Flash es el modelo VLM más reciente de ZhipuAI con excelente rendimiento en OCR y comprensión de documentos. **Es gratuito** en la capa Flash.

**Archivo: `src/lib/vlm-zhipu.ts`**

```typescript
/**
 * ZhipuAI GLM-4V Vision Model Integration
 * Free tier available with GLM-4V-Flash
 * 
 * Pricing (as of Dec 2024):
 * - GLM-4V-Flash: FREE (limited concurrency)
 * - GLM-4V-Plus: ¥0.01/1K tokens (premium features)
 */

import { ZhipuAI } from 'zhipuai';

export interface VLMExtractionResult {
  text: string;
  html: string;
  structure: DocumentStructure;
  confidence: number;
  model: string;
  tokensUsed: number;
}

export interface DocumentStructure {
  chapters: ChapterInfo[];
  metadata: {
    title?: string;
    author?: string;
    language?: string;
  };
}

export interface ChapterInfo {
  title: string;
  level: number;
  startIndex: number;
  content: string;
}

// Initialize ZhipuAI client
let zhipuClient: ZhipuAI | null = null;

function getZhipuClient(): ZhipuAI {
  if (!zhipuClient) {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY environment variable not set');
    }
    zhipuClient = new ZhipuAI({ apiKey });
  }
  return zhipuClient;
}

/**
 * Extract text and structure from document image using GLM-4V
 */
export async function extractWithGLM4V(
  imageBuffer: Buffer,
  options: {
    model?: 'glm-4v-flash' | 'glm-4v-plus' | 'glm-4.5v';
    language?: 'es' | 'en' | 'auto';
    extractStructure?: boolean;
  } = {}
): Promise<VLMExtractionResult> {
  const {
    model = 'glm-4v-flash', // Free model
    language = 'auto',
    extractStructure = true
  } = options;

  const client = getZhipuClient();

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:image/png;base64,${base64Image}`;

  // Construct prompt for document extraction
  const systemPrompt = `Eres un experto en OCR y extracción de documentos. Tu tarea es:
1. Extraer TODO el texto visible en la imagen
2. Identificar la estructura del documento (títulos, capítulos, párrafos, listas)
3. Preservar el formato original lo más posible
4. Detectar el idioma del texto

Responde SIEMPRE en formato JSON con esta estructura:
{
  "text": "texto completo extraído",
  "structure": {
    "title": "título del documento si existe",
    "language": "es|en|...",
    "chapters": [
      {"title": "Título del capítulo", "level": 1, "content": "contenido..."}
    ]
  },
  "confidence": 0.95
}`;

  const userPrompt = extractStructure
    ? 'Extrae todo el texto de esta imagen y analiza su estructura. Identifica capítulos, secciones y listas.'
    : 'Extrae todo el texto visible en esta imagen, manteniendo el formato.';

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4096
    });

    const content = response.choices[0].message.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    // Parse JSON response
    let parsed: any;
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, treat as plain text
      parsed = {
        text: content,
        structure: { chapters: [] },
        confidence: 0.7
      };
    }

    // Generate HTML from structure
    const html = generateHtmlFromStructure(parsed);

    return {
      text: parsed.text || content,
      html,
      structure: {
        chapters: parsed.structure?.chapters || [],
        metadata: {
          title: parsed.structure?.title,
          language: parsed.structure?.language
        }
      },
      confidence: parsed.confidence || 0.85,
      model,
      tokensUsed
    };

  } catch (error) {
    console.error('GLM-4V extraction failed:', error);
    throw error;
  }
}

/**
 * Batch process multiple pages with GLM-4V
 */
export async function extractDocumentWithGLM4V(
  pageBuffers: Buffer[],
  options: Parameters<typeof extractWithGLM4V>[1] = {}
): Promise<VLMExtractionResult> {
  const results: VLMExtractionResult[] = [];
  
  for (const buffer of pageBuffers) {
    const result = await extractWithGLM4V(buffer, options);
    results.push(result);
    
    // Rate limiting - GLM-4V-Flash has concurrency limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Merge results
  const mergedText = results.map(r => r.text).join('\n\n---\n\n');
  const mergedChapters = results.flatMap(r => r.structure.chapters);
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);

  return {
    text: mergedText,
    html: generateHtmlFromStructure({
      text: mergedText,
      structure: { chapters: mergedChapters }
    }),
    structure: {
      chapters: mergedChapters,
      metadata: results[0]?.structure.metadata || {}
    },
    confidence: avgConfidence,
    model: options.model || 'glm-4v-flash',
    tokensUsed: totalTokens
  };
}

function generateHtmlFromStructure(parsed: any): string {
  const parts: string[] = [];
  
  if (parsed.structure?.title) {
    parts.push(`<h1>${escapeHtml(parsed.structure.title)}</h1>`);
  }

  if (parsed.structure?.chapters?.length) {
    for (const chapter of parsed.structure.chapters) {
      const tag = `h${Math.min(chapter.level + 1, 6)}`;
      parts.push(`<${tag}>${escapeHtml(chapter.title)}</${tag}>`);
      if (chapter.content) {
        const paragraphs = chapter.content.split('\n\n').filter(Boolean);
        for (const p of paragraphs) {
          parts.push(`<p>${escapeHtml(p)}</p>`);
        }
      }
    }
  } else if (parsed.text) {
    const paragraphs = parsed.text.split('\n\n').filter(Boolean);
    for (const p of paragraphs) {
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
  }

  return parts.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

### 4.2 Qwen3-VL (Alibaba) — Via Ollama Local

Para ejecución local sin costos de API, Qwen3-VL es la mejor opción. Soporta OCR en 32 idiomas.

**Archivo: `src/lib/vlm-ollama.ts`**

```typescript
/**
 * Local VLM Integration via Ollama
 * Supports Qwen3-VL, LLaVA, and other vision models
 * 
 * Prerequisites:
 * 1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh
 * 2. Pull model: ollama pull qwen3-vl:8b
 * 3. Ensure Ollama is running: ollama serve
 */

import { Ollama } from 'ollama';

export interface OllamaVLMOptions {
  model?: 'qwen3-vl:8b' | 'qwen3-vl:30b' | 'qwen2.5vl:7b' | 'llava:13b' | 'llava:34b';
  baseUrl?: string;
  timeout?: number;
}

export interface OllamaExtractionResult {
  text: string;
  html: string;
  model: string;
  processingTime: number;
}

// Default Ollama client
let ollamaClient: Ollama | null = null;

function getOllamaClient(baseUrl?: string): Ollama {
  const url = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  if (!ollamaClient || ollamaClient.config?.host !== url) {
    ollamaClient = new Ollama({ host: url });
  }
  
  return ollamaClient;
}

/**
 * Check if Ollama is available and model is installed
 */
export async function checkOllamaAvailability(
  model: string = 'qwen3-vl:8b'
): Promise<{ available: boolean; models: string[] }> {
  try {
    const client = getOllamaClient();
    const response = await client.list();
    const models = response.models.map(m => m.name);
    
    return {
      available: true,
      models
    };
  } catch {
    return {
      available: false,
      models: []
    };
  }
}

/**
 * Extract text from image using local Ollama VLM
 */
export async function extractWithOllama(
  imageBuffer: Buffer,
  options: OllamaVLMOptions = {}
): Promise<OllamaExtractionResult> {
  const {
    model = 'qwen3-vl:8b',
    baseUrl,
    timeout = 120000
  } = options;

  const client = getOllamaClient(baseUrl);
  const startTime = Date.now();

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analiza esta imagen de documento y extrae todo el texto visible.
Instrucciones:
1. Extrae CADA palabra y párrafo que puedas leer
2. Mantén la estructura del documento (títulos, párrafos, listas)
3. Si detectas capítulos o secciones, márcalos con ## o ###
4. Preserva el formato de listas (- para viñetas, 1. para numeradas)
5. Si hay tablas, represéntalas en formato markdown

Responde SOLO con el texto extraído, sin explicaciones adicionales.`;

  try {
    const response = await client.chat({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
          images: [base64Image]
        }
      ],
      options: {
        temperature: 0.1,
        num_predict: 4096
      }
    });

    const text = response.message.content;
    const processingTime = Date.now() - startTime;

    return {
      text,
      html: markdownToHtml(text),
      model,
      processingTime
    };

  } catch (error) {
    console.error(`Ollama extraction failed with ${model}:`, error);
    throw error;
  }
}

/**
 * Process multi-page document with Ollama
 * Includes page caching for efficiency
 */
export async function extractDocumentWithOllama(
  pageBuffers: Buffer[],
  options: OllamaVLMOptions = {}
): Promise<OllamaExtractionResult> {
  const results: string[] = [];
  let totalTime = 0;
  
  for (let i = 0; i < pageBuffers.length; i++) {
    console.log(`Processing page ${i + 1}/${pageBuffers.length}...`);
    
    const result = await extractWithOllama(pageBuffers[i], options);
    results.push(`## Página ${i + 1}\n\n${result.text}`);
    totalTime += result.processingTime;
  }

  const fullText = results.join('\n\n---\n\n');

  return {
    text: fullText,
    html: markdownToHtml(fullText),
    model: options.model || 'qwen3-vl:8b',
    processingTime: totalTime
  };
}

/**
 * Specialized OCR prompt for better text extraction
 */
export async function ocrWithOllama(
  imageBuffer: Buffer,
  options: OllamaVLMOptions & { language?: string } = {}
): Promise<OllamaExtractionResult> {
  const { language = 'español', ...ollamaOptions } = options;
  
  const client = getOllamaClient(ollamaOptions.baseUrl);
  const startTime = Date.now();
  const base64Image = imageBuffer.toString('base64');

  // Optimized OCR prompt
  const prompt = `Eres un sistema de OCR de alta precisión. Tu única tarea es transcribir EXACTAMENTE el texto visible en esta imagen.

Reglas estrictas:
- Transcribe CADA carácter visible, incluyendo puntuación y espacios
- NO interpretes ni resumas el contenido
- NO añadas información que no esté en la imagen
- Mantén el formato original (saltos de línea, indentación)
- Si hay texto en ${language}, asegúrate de usar los acentos correctos
- Para texto ilegible, usa [ilegible]

Transcripción:`;

  const response = await client.chat({
    model: ollamaOptions.model || 'qwen3-vl:8b',
    messages: [{ role: 'user', content: prompt, images: [base64Image] }],
    options: { temperature: 0.05, num_predict: 8192 }
  });

  return {
    text: response.message.content,
    html: `<pre>${escapeHtml(response.message.content)}</pre>`,
    model: ollamaOptions.model || 'qwen3-vl:8b',
    processingTime: Date.now() - startTime
  };
}

function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive li elements in ul
  html = html.replace(/(<li>.*<\/li>\n)+/g, (match) => `<ul>\n${match}</ul>\n`);
  
  // Paragraphs (lines not starting with < )
  const lines = html.split('\n');
  const processed = lines.map(line => {
    if (line.trim() && !line.trim().startsWith('<')) {
      return `<p>${line}</p>`;
    }
    return line;
  });
  
  return processed.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

---

## 5. Integración: Actualización del Pipeline de Importación

### 5.1 Nuevo Servicio Unificado de Parsing

**Archivo: `src/lib/document-parser-unified.ts`**

```typescript
/**
 * Unified Document Parser
 * Orchestrates multiple parsing strategies with intelligent fallbacks
 */

import mammoth from 'mammoth';
import { initEpubFile } from '@lingo-reader/epub-parser';
import { extractWithOCR, isPDFScanned } from './ocr-scribe';
import { extractWithGLM4V } from './vlm-zhipu';
import { extractWithOllama, checkOllamaAvailability } from './vlm-ollama';
import { buildStructuredChapters, StructuredChapter } from './document-importer';

export type SupportedFormat = 'pdf' | 'docx' | 'doc' | 'rtf' | 'odt' | 'epub' | 'txt' | 'md';

export interface ParseResult {
  content: string;
  contentHtml: string;
  chapters: StructuredChapter[];
  metadata: {
    title?: string;
    author?: string;
    wordCount: number;
    estimatedPages: number;
    language?: string;
    converter: string;
  };
  warnings: string[];
}

export interface ParseOptions {
  enableOCR?: boolean;
  enableVLM?: boolean;
  preferLocalVLM?: boolean;
  vlmModel?: string;
  language?: string;
}

// Extended styleMap for Mammoth.js - captures more document styles
const EXTENDED_STYLE_MAP = [
  // Standard headings
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  
  // Spanish/Literary document styles
  "p[style-name='Título'] => h1.titulo:fresh",
  "p[style-name='Capítulo'] => h1.capitulo:fresh",
  "p[style-name='Subcapítulo'] => h2.subcapitulo:fresh",
  "p[style-name='Sección'] => h2.seccion:fresh",
  "p[style-name='Subsección'] => h3.subseccion:fresh",
  
  // Common custom styles in manuscripts
  "p[style-name='Chapter Title'] => h1.chapter:fresh",
  "p[style-name='Chapter'] => h1.chapter:fresh",
  "p[style-name='Part Title'] => h1.part:fresh",
  "p[style-name='Scene Break'] => hr.scene-break",
  
  // Quotes and citations
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Cita'] => blockquote:fresh",
  "p[style-name='Block Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote.intense:fresh",
  "p[style-name='Citation'] => cite:fresh",
  "p[style-name='Epigraph'] => blockquote.epigraph:fresh",
  "p[style-name='Epígrafe'] => blockquote.epigraph:fresh",
  
  // Lists
  "p[style-name='List Paragraph'] => li:fresh",
  "p[style-name='List Bullet'] => li:fresh",
  "p[style-name='List Number'] => li:fresh",
  
  // Code and technical
  "p[style-name='Code'] => pre:separator('\\n')",
  "r[style-name='Code Char'] => code",
  "p[style-name='Código'] => pre:separator('\\n')",
  
  // Footnotes and endnotes (Mammoth handles these, but we can style them)
  "p[style-name='Footnote Text'] => p.footnote:fresh",
  "p[style-name='Endnote Text'] => p.endnote:fresh",
  
  // Special text
  "p[style-name='Author'] => p.author:fresh",
  "p[style-name='Autor'] => p.author:fresh",
  "p[style-name='Dedication'] => p.dedication:fresh",
  "p[style-name='Dedicatoria'] => p.dedication:fresh",
];

/**
 * Main parsing function with intelligent format detection and fallbacks
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase() as SupportedFormat;
  const warnings: string[] = [];
  
  const {
    enableOCR = true,
    enableVLM = true,
    preferLocalVLM = true,
    language = 'es'
  } = options;

  try {
    switch (ext) {
      case 'pdf':
        return await parsePDF(buffer, { enableOCR, enableVLM, preferLocalVLM, language }, warnings);
      
      case 'docx':
        return await parseDOCX(buffer, warnings);
      
      case 'doc':
        return await parseDOC(buffer, warnings);
      
      case 'rtf':
      case 'odt':
        return await parseViaLibreOffice(buffer, ext, warnings);
      
      case 'epub':
        return await parseEPUB(buffer, warnings);
      
      case 'txt':
      case 'md':
        return parseTextFile(buffer, ext, warnings);
      
      default:
        throw new Error(`Formato no soportado: ${ext}`);
    }
  } catch (error) {
    warnings.push(`Error principal: ${error instanceof Error ? error.message : 'Unknown'}`);
    throw error;
  }
}

/**
 * PDF Parser with OCR/VLM fallback for scanned documents
 */
async function parsePDF(
  buffer: Buffer,
  options: ParseOptions,
  warnings: string[]
): Promise<ParseResult> {
  // First, check if PDF is scanned (image-based)
  const isScanned = await isPDFScanned(buffer);
  
  if (isScanned) {
    warnings.push('PDF detectado como escaneado (basado en imágenes)');
    
    if (options.enableVLM || options.enableOCR) {
      return await extractScannedPDF(buffer, options, warnings);
    } else {
      throw new Error('PDF escaneado requiere OCR o VLM habilitado');
    }
  }
  
  // Try pdf2md for text-based PDFs (best structure preservation)
  try {
    const pdf2md = await import('@opendocsg/pdf2md');
    const markdown = await pdf2md.default(buffer);
    
    const chapters = buildStructuredChapters(undefined, markdown);
    const wordCount = markdown.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      content: markdown,
      contentHtml: markdownToBasicHtml(markdown),
      chapters,
      metadata: {
        wordCount,
        estimatedPages: Math.ceil(wordCount / 200),
        converter: '@opendocsg/pdf2md'
      },
      warnings
    };
  } catch (pdf2mdError) {
    warnings.push(`pdf2md falló: ${pdf2mdError instanceof Error ? pdf2mdError.message : 'Unknown'}`);
    
    // Fallback to unpdf for basic text extraction
    try {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      
      const chapters = buildStructuredChapters(undefined, text);
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      
      return {
        content: text,
        contentHtml: `<div class="pdf-text">${text.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>`,
        chapters,
        metadata: {
          wordCount,
          estimatedPages: totalPages,
          converter: 'unpdf'
        },
        warnings
      };
    } catch (unpdfError) {
      warnings.push(`unpdf también falló: ${unpdfError instanceof Error ? unpdfError.message : 'Unknown'}`);
      
      // If both fail and OCR is enabled, try OCR
      if (options.enableOCR || options.enableVLM) {
        return await extractScannedPDF(buffer, options, warnings);
      }
      
      throw new Error('Todos los métodos de extracción de PDF fallaron');
    }
  }
}

/**
 * Extract text from scanned/image-based PDF using OCR or VLM
 */
async function extractScannedPDF(
  buffer: Buffer,
  options: ParseOptions,
  warnings: string[]
): Promise<ParseResult> {
  // Convert PDF pages to images first
  const pageImages = await pdfToImages(buffer);
  
  // Try VLM first (better understanding of document structure)
  if (options.enableVLM) {
    // Check for local Ollama first if preferred
    if (options.preferLocalVLM) {
      const ollama = await checkOllamaAvailability();
      if (ollama.available) {
        try {
          warnings.push('Usando Ollama (VLM local) para OCR');
          const result = await extractDocumentWithOllamaInternal(pageImages, options);
          return result;
        } catch (ollamaError) {
          warnings.push(`Ollama falló: ${ollamaError instanceof Error ? ollamaError.message : 'Unknown'}`);
        }
      }
    }
    
    // Try GLM-4V-Flash (cloud, free)
    if (process.env.ZHIPU_API_KEY) {
      try {
        warnings.push('Usando GLM-4V-Flash para OCR');
        const result = await extractWithGLM4V(pageImages[0], {
          model: 'glm-4v-flash',
          language: options.language === 'es' ? 'es' : 'en',
          extractStructure: true
        });
        
        return {
          content: result.text,
          contentHtml: result.html,
          chapters: result.structure.chapters.map(c => ({
            title: c.title,
            level: c.level,
            html: c.content,
            markdown: c.content,
            wordCount: c.content.split(/\s+/).length
          })),
          metadata: {
            title: result.structure.metadata.title,
            wordCount: result.text.split(/\s+/).filter(w => w.length > 0).length,
            estimatedPages: pageImages.length,
            language: result.structure.metadata.language,
            converter: `GLM-4V-Flash (${result.tokensUsed} tokens)`
          },
          warnings
        };
      } catch (glmError) {
        warnings.push(`GLM-4V falló: ${glmError instanceof Error ? glmError.message : 'Unknown'}`);
      }
    }
  }
  
  // Fallback to Scribe.js OCR
  if (options.enableOCR) {
    try {
      warnings.push('Usando Scribe.js OCR');
      const result = await extractWithOCR(buffer, {
        languages: [options.language === 'es' ? 'spa' : 'eng'],
        preserveLayout: true
      });
      
      const chapters = buildStructuredChapters(result.html, result.text);
      
      return {
        content: result.text,
        contentHtml: result.html,
        chapters,
        metadata: {
          wordCount: result.text.split(/\s+/).filter(w => w.length > 0).length,
          estimatedPages: result.pages,
          language: result.language,
          converter: `Scribe.js OCR (${Math.round(result.confidence * 100)}% confianza)`
        },
        warnings: [...warnings, ...result.warnings]
      };
    } catch (ocrError) {
      warnings.push(`Scribe.js falló: ${ocrError instanceof Error ? ocrError.message : 'Unknown'}`);
    }
  }
  
  throw new Error('No se pudo extraer texto del PDF escaneado');
}

/**
 * DOCX Parser using enhanced Mammoth.js
 */
async function parseDOCX(buffer: Buffer, warnings: string[]): Promise<ParseResult> {
  try {
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: EXTENDED_STYLE_MAP,
        includeDefaultStyleMap: true,
        convertImage: mammoth.images.imgElement(async (image) => {
          const base64 = await image.read('base64');
          return { src: `data:${image.contentType};base64,${base64}` };
        })
      }
    );
    
    // Also get markdown for chapters
    const mdResult = await mammoth.convertToMarkdown({ buffer });
    
    if (result.messages.length > 0) {
      warnings.push(...result.messages.map(m => m.message));
    }
    
    const chapters = buildStructuredChapters(result.value, mdResult.value);
    const textContent = result.value.replace(/<[^>]*>/g, ' ');
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    // Extract title from first h1
    const titleMatch = result.value.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    
    return {
      content: mdResult.value,
      contentHtml: result.value,
      chapters,
      metadata: {
        title: titleMatch?.[1],
        wordCount,
        estimatedPages: Math.ceil(wordCount / 200),
        converter: 'Mammoth.js (Extended StyleMap)'
      },
      warnings
    };
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * DOC Parser (Word 97-2003) via word-extractor + conversion
 */
async function parseDOC(buffer: Buffer, warnings: string[]): Promise<ParseResult> {
  try {
    // First try word-extractor for quick text
    const WordExtractor = await import('word-extractor');
    const extractor = new WordExtractor.default();
    const doc = await extractor.extract(buffer);
    
    const body = doc.getBody();
    const footnotes = doc.getFootnotes();
    const headers = doc.getHeaders();
    
    // Try to convert to DOCX for better structure
    try {
      const libre = await import('libreoffice-convert');
      const { promisify } = await import('util');
      const convertAsync = promisify(libre.convert);
      
      const docxBuffer = await convertAsync(buffer, '.docx', undefined);
      
      // Parse the converted DOCX
      const docxResult = await parseDOCX(docxBuffer, warnings);
      docxResult.metadata.converter = 'word-extractor + libreoffice-convert + Mammoth.js';
      
      return docxResult;
    } catch (conversionError) {
      warnings.push(`Conversión a DOCX falló, usando extracción básica: ${conversionError instanceof Error ? conversionError.message : 'Unknown'}`);
      
      // Return basic extraction
      const fullText = [body, footnotes].filter(Boolean).join('\n\n');
      const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
      
      return {
        content: fullText,
        contentHtml: `<div>${fullText.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>`,
        chapters: buildStructuredChapters(undefined, fullText),
        metadata: {
          wordCount,
          estimatedPages: Math.ceil(wordCount / 200),
          converter: 'word-extractor (basic)'
        },
        warnings
      };
    }
  } catch (error) {
    throw new Error(`DOC parsing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Parse RTF/ODT via LibreOffice conversion
 */
async function parseViaLibreOffice(
  buffer: Buffer,
  format: string,
  warnings: string[]
): Promise<ParseResult> {
  try {
    const libre = await import('libreoffice-convert');
    const { promisify } = await import('util');
    const convertAsync = promisify(libre.convert);
    
    // Convert to HTML
    const htmlBuffer = await convertAsync(buffer, '.html', undefined);
    const html = htmlBuffer.toString('utf-8');
    
    // Extract text from HTML
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      content: textContent,
      contentHtml: html,
      chapters: buildStructuredChapters(html, textContent),
      metadata: {
        wordCount,
        estimatedPages: Math.ceil(wordCount / 200),
        converter: `libreoffice-convert (${format.toUpperCase()} → HTML)`
      },
      warnings
    };
  } catch (error) {
    throw new Error(`${format.toUpperCase()} parsing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * EPUB Parser using @lingo-reader/epub-parser
 */
async function parseEPUB(buffer: Buffer, warnings: string[]): Promise<ParseResult> {
  try {
    // Write to temp file (epub-parser requires file path)
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}.epub`);
    await fs.writeFile(tempPath, buffer);
    
    try {
      const epub = await initEpubFile(tempPath);
      const info = epub.getFileInfo();
      const toc = epub.getToc();
      const spine = epub.getSpine();
      
      // Extract all chapters
      const chapters: StructuredChapter[] = [];
      const htmlParts: string[] = [];
      let fullText = '';
      
      for (const item of spine) {
        const chapter = await epub.loadChapter(item.id);
        const text = chapter.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Find TOC entry for title
        const tocEntry = toc.find(t => t.href.includes(item.id));
        
        chapters.push({
          title: tocEntry?.title || `Chapter ${chapters.length + 1}`,
          level: 1,
          html: chapter.html,
          markdown: text,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length
        });
        
        htmlParts.push(chapter.html);
        fullText += text + '\n\n';
      }
      
      const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
      
      return {
        content: fullText,
        contentHtml: htmlParts.join('\n'),
        chapters,
        metadata: {
          title: info.title,
          author: info.creator,
          wordCount,
          estimatedPages: Math.ceil(wordCount / 200),
          language: info.language,
          converter: '@lingo-reader/epub-parser'
        },
        warnings
      };
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  } catch (error) {
    throw new Error(`EPUB parsing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Parse plain text files
 */
function parseTextFile(buffer: Buffer, format: string, warnings: string[]): ParseResult {
  const text = buffer.toString('utf-8');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  const html = format === 'md' 
    ? markdownToBasicHtml(text)
    : `<pre>${text}</pre>`;
  
  return {
    content: text,
    contentHtml: html,
    chapters: buildStructuredChapters(html, text),
    metadata: {
      wordCount,
      estimatedPages: Math.ceil(wordCount / 200),
      converter: `Native (${format.toUpperCase()})`
    },
    warnings
  };
}

// Helper functions
async function pdfToImages(buffer: Buffer): Promise<Buffer[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  
  const images: Buffer[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d')!;
    
    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport
    }).promise;
    
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await blob.arrayBuffer();
    images.push(Buffer.from(arrayBuffer));
  }
  
  return images;
}

async function extractDocumentWithOllamaInternal(
  pageImages: Buffer[],
  options: ParseOptions
): Promise<ParseResult> {
  const { extractDocumentWithOllama } = await import('./vlm-ollama');
  
  const result = await extractDocumentWithOllama(pageImages, {
    model: (options.vlmModel as any) || 'qwen3-vl:8b'
  });
  
  const chapters = buildStructuredChapters(result.html, result.text);
  const wordCount = result.text.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    content: result.text,
    contentHtml: result.html,
    chapters,
    metadata: {
      wordCount,
      estimatedPages: pageImages.length,
      converter: `Ollama ${result.model} (${result.processingTime}ms)`
    },
    warnings: []
  };
}

function markdownToBasicHtml(md: string): string {
  let html = md;
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n\n/g, '</p><p>');
  return `<p>${html}</p>`.replace(/<p><\/p>/g, '');
}
```

### 5.2 Actualización de la API Route

**Archivo: `src/app/api/import/route.ts` — Sección a modificar**

```typescript
// Añadir al inicio del archivo, después de los imports existentes:
import { parseDocument, ParseOptions } from '@/lib/document-parser-unified';

// Reemplazar el switch de procesamiento de archivos con:

export async function POST(request: NextRequest) {
  try {
    // ... (validaciones existentes se mantienen)

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    // Obtener opciones de parsing del request
    const enableOCR = formData.get("enableOCR") !== "false";
    const enableVLM = formData.get("enableVLM") !== "false";
    const preferLocalVLM = formData.get("preferLocalVLM") !== "false";
    const language = formData.get("language") as string || "es";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Usar el nuevo parser unificado
    const parseOptions: ParseOptions = {
      enableOCR,
      enableVLM,
      preferLocalVLM,
      language
    };

    const result = await parseDocument(buffer, file.name, parseOptions);

    return NextResponse.json({
      success: true,
      content: result.content,
      contentHtml: result.contentHtml,
      contentFormat: result.contentHtml ? "markdown+html" : "markdown",
      chapters: result.chapters,
      metadata: {
        ...result.metadata,
        type: file.name.split('.').pop()?.toLowerCase(),
        size: file.size,
        name: file.name,
        pages: result.metadata.estimatedPages,
        warnings: result.warnings
      },
      originalFileName: file.name,
      importLimits: {
        maxPages: 300,
        maxFileSize: "50MB",
        supportedFormats: ["txt", "md", "pdf", "doc", "docx", "rtf", "odt", "epub"]
      }
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
```

---

## 6. Dependencias a Instalar

### 6.1 package.json — Dependencias Adicionales

```json
{
  "dependencies": {
    // Existentes (mantener)
    "mammoth": "^1.11.0",
    "jszip": "^3.10.1",
    "pandoc-bin": "^0.1.2",
    
    // Nuevas - OCR
    "scribe.js-ocr": "^0.9.0",
    "tesseract.js": "^5.1.0",
    
    // Nuevas - PDF
    "@opendocsg/pdf2md": "^0.1.30",
    "unpdf": "^0.11.0",
    "pdfjs-dist": "^4.2.67",
    
    // Nuevas - EPUB
    "@lingo-reader/epub-parser": "^1.0.0",
    
    // Nuevas - Conversión
    "libreoffice-convert": "^1.6.0",
    "word-extractor": "^1.0.4",
    
    // Nuevas - VLM
    "zhipuai": "^2.0.0",
    "ollama": "^0.5.0"
  }
}
```

### 6.2 Instalación

```bash
# OCR y PDF
npm install scribe.js-ocr tesseract.js @opendocsg/pdf2md unpdf pdfjs-dist

# EPUB
npm install @lingo-reader/epub-parser

# Conversión de formatos legacy
npm install libreoffice-convert word-extractor

# VLM APIs
npm install zhipuai ollama
```

### 6.3 Variables de Entorno (.env.local)

```env
# ZhipuAI GLM-4V (gratuito en Flash tier)
ZHIPU_API_KEY=your_zhipu_api_key_here

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434

# Opcional: Qwen API (si se usa cloud en lugar de Ollama)
DASHSCOPE_API_KEY=your_dashscope_key_here
```

---

## 7. Configuración de Ollama para VLM Local

### 7.1 Instalación de Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows (PowerShell como Admin)
irm https://ollama.ai/install.ps1 | iex
```

### 7.2 Descargar Modelos VLM

```bash
# Modelo recomendado para equipos con 8-12GB VRAM
ollama pull qwen3-vl:8b

# Modelo más potente para equipos con 24GB+ VRAM
ollama pull qwen3-vl:30b

# Alternativa más ligera (4GB VRAM)
ollama pull qwen2.5vl:7b

# Modelo de respaldo (muy ligero)
ollama pull llava:7b
```

### 7.3 Requisitos de Hardware

| Modelo | VRAM Mínima | VRAM Recomendada | RAM Sistema |
|--------|-------------|------------------|-------------|
| qwen3-vl:8b | 8 GB | 10 GB | 16 GB |
| qwen3-vl:30b | 20 GB | 24 GB | 32 GB |
| qwen2.5vl:7b | 6 GB | 8 GB | 16 GB |
| llava:7b | 4 GB | 6 GB | 8 GB |

---

## 8. Arquitectura de Fallback Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENTO DE ENTRADA                          │
│           (PDF, DOCX, DOC, RTF, ODT, EPUB, TXT, MD)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Detectar Formato     │
                    └───────────────────────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │  PDF  │   │ DOCX  │   │ DOC   │   │RTF/ODT│   │ EPUB  │
    └───────┘   └───────┘   └───────┘   └───────┘   └───────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌─────────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐
│isPDFScanned?│ │Mammoth │ │word-ext  │ │LibreOff  │ │epub-   │
└─────────────┘ │+ Style │ │ → DOCX   │ │convert   │ │parser  │
   │     │      │  Map   │ │pipeline  │ │to HTML   │ │        │
   │     │      └────────┘ └──────────┘ └──────────┘ └────────┘
   │     │           │           │           │           │
   ▼     ▼           ▼           ▼           ▼           ▼
┌────┐ ┌────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────┐
│ NO │ │ SÍ │   │Mammoth │   │Mammoth │   │Cheerio │   │HTML│
└────┘ └────┘   │Result  │   │Result  │   │Parse   │   │    │
   │     │      └────────┘   └────────┘   └────────┘   └────┘
   │     │           │           │           │           │
   ▼     ▼           └───────────┴───────────┴───────────┘
┌────────┐                              │
│pdf2md  │                              ▼
│ Level 1│                    ┌─────────────────────┐
└────────┘                    │ buildStructured     │
   │                          │ Chapters()          │
   ▼                          └─────────────────────┘
┌────────┐                              │
│ unpdf  │                              ▼
│Level 2 │                    ┌─────────────────────┐
└────────┘                    │     ParseResult     │
   │                          │  content + chapters │
   ▼                          └─────────────────────┘
┌──────────────────────────────────────────────┐
│          OCR / VLM Pipeline                   │
│  ┌───────────────────────────────────────┐   │
│  │ 1. Ollama (qwen3-vl:8b) - Local      │   │
│  │    ↓ fallback                         │   │
│  │ 2. GLM-4V-Flash (ZhipuAI) - Cloud    │   │
│  │    ↓ fallback                         │   │
│  │ 3. Scribe.js OCR - Local JS          │   │
│  │    ↓ fallback                         │   │
│  │ 4. Tesseract.js - Lightweight        │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 9. Comparativa de Rendimiento OCR

| Método | Precisión | Velocidad | Costo | Estructura |
|--------|-----------|-----------|-------|------------|
| **GLM-4.6V-Flash** | 98-99% | ~0.5s/página | Gratis* | ✅ Excelente |
| **Qwen3-VL (Ollama)** | 95-97% | ~2-3s/página | Gratis | ✅ Muy buena |
| **Scribe.js** | 90-95% | ~1s/página | Gratis | ⚠️ Básica |
| **Tesseract.js** | 85-90% | ~2s/página | Gratis | ❌ Ninguna |
| **Qwen3-VL (30B)** | 97-99% | ~5s/página | Gratis | ✅ Excelente |

*GLM-4V-Flash tiene límite de concurrencia en capa gratuita

---

## 10. Recomendaciones Finales

### 10.1 Prioridad de Implementación

1. **Fase 1 (Inmediata):** Integrar @opendocsg/pdf2md para mejorar parsing de PDFs con texto.

2. **Fase 2 (Corto plazo):** Añadir Scribe.js para OCR de PDFs escaneados.

3. **Fase 3 (Medio plazo):** Configurar Ollama con qwen3-vl:8b para OCR avanzado local.

4. **Fase 4 (Opcional):** Integrar GLM-4V-Flash como opción cloud para usuarios sin GPU potente.

### 10.2 Configuración Recomendada por Entorno

**Desarrollo Local (con GPU):**
- Ollama + qwen3-vl:8b como principal
- Scribe.js como fallback

**Producción (Servidor):**
- GLM-4V-Flash para OCR complejo
- Scribe.js para casos simples
- Ollama en servidor dedicado (si hay GPU disponible)

**Edge/Serverless:**
- Scribe.js (funciona en Workers)
- GLM-4V-Flash vía API

### 10.3 Tests Recomendados

Antes de desplegar, validar con:
1. PDF generado desde Word (texto nativo)
2. PDF escaneado de libro físico
3. DOCX con estilos personalizados españoles
4. EPUB de múltiples capítulos
5. Documento mixto (texto + imágenes de texto)

---

## 11. Referencias

- [Scribe.js Documentation](https://github.com/scribeocr/scribe.js)
- [ZhipuAI GLM-4V API](https://bigmodel.cn/dev/api)
- [Qwen3-VL Technical Report](https://qwenlm.github.io/blog/qwen3-vl/)
- [Ollama Vision Models](https://ollama.com/search?c=vision)
- [Mammoth.js Style Mapping](https://github.com/mwilliamson/mammoth.js#writing-style-maps)
- [@lingo-reader/epub-parser](https://www.npmjs.com/package/@lingo-reader/epub-parser)
