# Librerías JavaScript para Parsing de Documentos con Preservación Semántica

La extracción semántica de documentos en JavaScript presenta desafíos fundamentales según el formato: **PDF no almacena estructura semántica** (solo coordenadas visuales), mientras que **DOCX, ODT y EPUB preservan etiquetas semánticas** en su XML interno. Esta realidad técnica determina las estrategias óptimas para cada formato.

## El problema central: PDF vs formatos estructurados

El PDF es un **formato de presentación visual**, no semántico. Cuando Word exporta un documento a PDF, convierte "Heading 1" en "texto 14pt Bold Times New Roman en posición (72, 720)". No existe ninguna etiqueta H1 en el archivo resultante. Esta limitación fundamental afecta todas las librerías JavaScript de parsing PDF—ninguna puede extraer estructura semántica que no existe en el archivo original.

En contraste, DOCX (Office Open XML), ODT (OpenDocument) y EPUB almacenan contenido en archivos XML dentro de contenedores ZIP, con etiquetas semánticas explícitas como `<w:pStyle w:val="Heading1"/>` o `<text:h text:outline-level="1">`.

## Stack recomendado por formato

| Formato | Librería Principal | Fallback | Preservación Semántica |
|---------|-------------------|----------|------------------------|
| **PDF** | @opendocsg/pdf2md | unpdf + heurísticas | ⚠️ Heurística (60-80%) |
| **DOCX** | Mammoth.js + styleMap extendido | docx-preview parseAsync() | ✅ Buena (85-95%) |
| **DOC** | word-extractor → libreoffice-convert → DOCX pipeline | Pandoc | ✅ Buena via conversión |
| **RTF** | libreoffice-convert → HTML | rtf.js + jsdom | ✅ Buena via conversión |
| **ODT** | libreoffice-convert → HTML | JSZip + xmldom manual | ✅ Buena via conversión |
| **EPUB** | @lingo-reader/epub-parser | epub (julien-c) | ✅ Excelente (nativo) |
| **TXT** | Node.js fs nativo | - | N/A |
| **MD** | unified + remark-parse | marked | ✅ Excelente (nativo) |

---

## Análisis detallado: Librerías PDF

### @opendocsg/pdf2md — Mejor opción para estructura semántica

Esta es la **única librería JavaScript que intenta detectar jerarquía de headings** mediante heurísticas de tamaño de fuente. Convierte PDF a Markdown con encabezados (#, ##, ###) inferidos.

```typescript
import pdf2md from '@opendocsg/pdf2md';
import { readFile } from 'fs/promises';

interface ParsedPDF {
  markdown: string;
  sections: { level: number; title: string; content: string }[];
}

export async function parsePDF(filePath: string): Promise<ParsedPDF> {
  const buffer = await readFile(filePath);
  const markdown = await pdf2md(buffer);
  
  // Extraer estructura de headings del markdown
  const sections = markdown.split(/^(#{1,6})\s+(.+)$/gm)
    .reduce((acc, part, i, arr) => {
      if (part.match(/^#{1,6}$/)) {
        acc.push({
          level: part.length,
          title: arr[i + 1] || '',
          content: ''
        });
      }
      return acc;
    }, [] as ParsedPDF['sections']);
  
  return { markdown, sections };
}
```

| Criterio | Valor |
|----------|-------|
| Licencia | MIT |
| Descargas npm/semana | ~50,000 |
| Última actualización | Octubre 2024 |
| Compatibilidad Node.js | ✅ Sí |
| Bundle size | ~109 KB |
| Headings | ✅ Heurística por tamaño fuente |
| Listas | ⚠️ Básico |
| Tablas | ⚠️ Básico |
| Links | ✅ Preservados |

**Limitación crítica**: Para PDFs de 200+ páginas, requiere `--max-old-space-size=4096` por consumo de memoria.

### unpdf — Óptimo para serverless

Diseñado específicamente para entornos serverless (Vercel Edge, Cloudflare Workers), incluye build optimizado de pdf.js.

```typescript
import { extractText, getDocumentProxy } from 'unpdf';

export async function extractPDFWithCoordinates(buffer: Uint8Array) {
  const pdf = await getDocumentProxy(buffer);
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  
  // Para análisis avanzado, acceder a items individuales con coordenadas
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    textContent.items.forEach(item => {
      const fontSize = Math.abs(item.transform[0]);
      // Heurística: fontSize > 14 probablemente es heading
      console.log({ text: item.str, fontSize, isHeading: fontSize > 14 });
    });
  }
  
  return { totalPages, text };
}
```

| Criterio | Valor |
|----------|-------|
| Licencia | MIT |
| Descargas npm/semana | ~50,000 |
| Compatibilidad serverless | ✅✅ Excelente |
| Bundle size | Incluye pdf.js optimizado |
| Estructura semántica | ❌ No (solo coordenadas) |

### Comparativa completa de librerías PDF

| Librería | Licencia | Downloads/semana | Headings | Listas | Tablas | Links | Serverless |
|----------|----------|-----------------|----------|--------|--------|-------|------------|
| **pdfjs-dist** | Apache-2.0 | 2.5M | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| **pdf-parse v2** | MIT | 600K | ❌ | ❌ | ⚠️ | ✅ | ✅ |
| **pdf2json** | Apache-2.0 | 285K | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **unpdf** | MIT | 50K | ❌ | ❌ | ❌ | ✅ | ✅✅ |
| **@opendocsg/pdf2md** | MIT | 50K | ✅⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| **pdf-lib** | MIT | 2.5M | N/A | N/A | N/A | N/A | ✅ |

**Nota**: pdf-lib es exclusivamente para **creación/modificación** de PDFs, no para extracción.

---

## Análisis detallado: Librerías DOCX/DOC

### Mammoth.js con styleMap extendido — Configuración optimizada

Mammoth.js sigue siendo la mejor opción para DOCX, pero requiere configuración extendida para capturar estilos personalizados comunes en libros.

```typescript
import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

const bookStyleMap = [
  // Headings estándar y personalizados
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Chapter Title'] => h1.chapter:fresh",
  "p[style-name='Section'] => h2.section:fresh",
  "p[style-name='Subsection'] => h3:fresh",
  
  // Block quotes y citaciones
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Block Text'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote.intense:fresh",
  "p[style-name='Citation'] => cite:fresh",
  "p[style-name='Bibliography'] => cite.bibliography:fresh",
  
  // Listas
  "p[style-name='List Paragraph'] => li:fresh",
  
  // Código
  "p[style-name='Code'] => pre:separator('\\n')",
  "r[style-name='Code Char'] => code",
  
  // Notas al pie (mammoth las soporta nativamente)
  // pero se pueden personalizar referencias
];

interface ParsedDocx {
  html: string;
  messages: mammoth.Message[];
  footnotes: string[];
}

export async function parseDocx(filePath: string): Promise<ParsedDocx> {
  const buffer = await readFile(filePath);
  
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: bookStyleMap,
      includeDefaultStyleMap: true,
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64');
        return { src: `data:${image.contentType};base64,${base64}` };
      })
    }
  );
  
  return {
    html: result.value,
    messages: result.messages,
    footnotes: [] // Mammoth incluye footnotes en el HTML principal
  };
}
```

**Limitaciones conocidas de Mammoth.js:**
- Listas anidadas con saltos de contenido se fragmentan (issues #74, #121)
- Formato de tablas (bordes, estilos de celda) ignorado
- Estilos personalizados requieren mapeo manual
- No soporta .doc (Word 97-2003)

### docx-preview para documentos complejos

Para documentos con estructura compleja que Mammoth no maneja bien, docx-preview ofrece acceso al modelo interno del documento.

```typescript
import { parseAsync, WordDocument } from 'docx-preview';

export async function parseComplexDocx(buffer: ArrayBuffer): Promise<WordDocument> {
  const wordDocument = await parseAsync(buffer, {
    renderFootnotes: true,
    renderEndnotes: true,
    renderHeaders: true,
    renderComments: true,
    experimental: true, // Habilita tab stops y track changes
  });
  
  return wordDocument;
}
```

| Criterio | Mammoth.js | docx-preview | docx4js |
|----------|------------|--------------|---------|
| Licencia | BSD-2-Clause | Apache-2.0 | MIT |
| Downloads/semana | 700K | 111K | 6K |
| Última actualización | 1 mes | Activo | 1 año |
| Headings | ✅ | ✅ | ✅ |
| Listas anidadas | ⚠️ | ✅ | ✅ |
| Footnotes/Endnotes | ✅ | ✅ | ⚠️ |
| Tablas con formato | ⚠️ | ✅ | ✅ |
| DOC support | ❌ | ❌ | ❌ |
| Bundle size | 200KB | 964KB | 4.4MB |

### Pipeline para archivos DOC (Word 97-2003)

Ninguna librería JavaScript parsea .doc directamente con estructura semántica. La estrategia es conversión.

```typescript
import WordExtractor from 'word-extractor';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

interface DocParseResult {
  // Extracción rápida (solo texto)
  quickExtract: {
    body: string;
    footnotes: string;
    endnotes: string;
    headers: Record<string, string>;
    annotations: string[];
  };
  // Conversión completa a DOCX para parsing estructurado
  convertedDocx?: Buffer;
}

export async function parseDocFile(buffer: Buffer): Promise<DocParseResult> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  
  const quickExtract = {
    body: doc.getBody(),
    footnotes: doc.getFootnotes(),
    endnotes: doc.getEndnotes(),
    headers: doc.getHeaders(),
    annotations: doc.getAnnotations(),
  };
  
  // Conversión a DOCX para parsing completo con estructura
  let convertedDocx: Buffer | undefined;
  try {
    convertedDocx = await convertAsync(buffer, '.docx', undefined);
  } catch (e) {
    console.warn('LibreOffice conversion failed, using text-only extraction');
  }
  
  return { quickExtract, convertedDocx };
}
```

---

## Análisis detallado: Librerías RTF y ODT

### RTF — Ecosistema limitado en JavaScript

Las librerías RTF nativas en JavaScript tienen limitaciones significativas. **La recomendación principal es usar LibreOffice para conversión**.

| Librería | Licencia | Última actualización | Tablas | Listas | Headings | Uso recomendado |
|----------|----------|---------------------|--------|--------|----------|-----------------|
| **rtf-stream-parser** | MIT | Nov 2024 ✅ | ❌ | ❌ | ❌ | Email de-encapsulation |
| **rtf.js** | MIT | 3 años | ⚠️ | ⚠️ | ⚠️ | Renderizado visual |
| **rtf-parser** | ISC | 6 años | ❌ | ❌ | ❌ | Parsing básico |

```typescript
// Estrategia recomendada: LibreOffice → HTML → Parse
import libre from 'libreoffice-convert';
import * as cheerio from 'cheerio';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

interface StructuredDocument {
  headings: { level: number; text: string }[];
  paragraphs: string[];
  lists: { type: 'ordered' | 'unordered'; items: string[] }[];
}

export async function parseRTF(buffer: Buffer): Promise<StructuredDocument> {
  const htmlBuffer = await convertAsync(buffer, '.html', undefined);
  const $ = cheerio.load(htmlBuffer.toString());
  
  return {
    headings: $('h1, h2, h3, h4, h5, h6').map((_, el) => ({
      level: parseInt(el.tagName[1]),
      text: $(el).text().trim()
    })).get(),
    
    paragraphs: $('p').map((_, el) => $(el).text().trim()).get(),
    
    lists: $('ul, ol').map((_, el) => ({
      type: el.tagName === 'ol' ? 'ordered' : 'unordered',
      items: $(el).find('li').map((_, li) => $(li).text().trim()).get()
    })).get()
  };
}
```

### ODT — Manual parsing viable pero costoso

ODT es XML dentro de ZIP, lo que permite parsing manual con JSZip. Sin embargo, LibreOffice sigue siendo más confiable.

```typescript
import JSZip from 'jszip';
import { DOMParser } from 'xmldom';

interface ODTContent {
  headings: { level: number; text: string }[];
  paragraphs: string[];
  lists: { items: string[] }[];
}

export async function parseODT(buffer: Buffer): Promise<ODTContent> {
  const zip = await JSZip.loadAsync(buffer);
  const contentXml = await zip.file('content.xml')?.async('string');
  
  if (!contentXml) throw new Error('Invalid ODT: missing content.xml');
  
  const doc = new DOMParser().parseFromString(contentXml, 'text/xml');
  
  // ODT usa namespaces específicos
  const headings = Array.from(doc.getElementsByTagName('text:h')).map(h => ({
    level: parseInt(h.getAttribute('text:outline-level') || '1'),
    text: h.textContent || ''
  }));
  
  const paragraphs = Array.from(doc.getElementsByTagName('text:p'))
    .map(p => p.textContent || '')
    .filter(text => text.trim());
  
  const lists = Array.from(doc.getElementsByTagName('text:list')).map(list => ({
    items: Array.from(list.getElementsByTagName('text:list-item'))
      .map(item => item.textContent || '')
  }));
  
  return { headings, paragraphs, lists };
}
```

---

## Análisis detallado: Librerías EPUB

### @lingo-reader/epub-parser — Recomendación principal

La librería más moderna y activamente mantenida, con soporte completo para **EPUB 2 y EPUB 3**.

```typescript
import { initEpubFile } from '@lingo-reader/epub-parser';

interface ParsedEpub {
  metadata: {
    title: string;
    creator: string;
    language: string;
    publisher?: string;
  };
  toc: { title: string; href: string; children?: any[] }[];
  chapters: { id: string; html: string }[];
}

export async function parseEpub(filePath: string): Promise<ParsedEpub> {
  const epub = await initEpubFile(filePath);
  
  const fileInfo = epub.getFileInfo();
  const toc = epub.getToc();
  const spine = epub.getSpine();
  
  const chapters = await Promise.all(
    spine.map(async (item) => {
      const content = await epub.loadChapter(item.id);
      return {
        id: item.id,
        html: content.html // Preserva H1-H6, listas, links
      };
    })
  );
  
  return {
    metadata: {
      title: fileInfo.title || '',
      creator: fileInfo.creator || '',
      language: fileInfo.language || 'en',
      publisher: fileInfo.publisher
    },
    toc,
    chapters
  };
}
```

| Criterio | @lingo-reader/epub-parser | epub (julien-c) | epubjs |
|----------|---------------------------|-----------------|--------|
| Licencia | MIT | MIT | BSD-3-Clause |
| Última actualización | Diciembre 2024 ✅ | Enero 2025 | 2020 |
| EPUB 3 support | ✅ | ⚠️ Limitado | ✅ |
| Server-side Node.js | ✅ | ✅ | ❌ |
| TypeScript nativo | ✅ | ✅ | ⚠️ |
| API | async/await | callbacks | DOM-based |
| TOC extraction | ✅ | ✅ | ✅ |
| Chapter HTML | ✅ | ✅ | ❌ |
| Media overlays | ✅ | ❌ | ❌ |

---

## Soluciones alternativas: Servicios de conversión

### Arquitectura recomendada con servicios Docker

Para producción con múltiples formatos, la combinación de servicios proporciona mayor confiabilidad.

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - gotenberg
      - tika
    environment:
      - GOTENBERG_URL=http://gotenberg:3000
      - TIKA_URL=http://tika:9998

  gotenberg:
    image: gotenberg/gotenberg:8
    ports:
      - "3001:3000"
    restart: unless-stopped

  tika:
    image: apache/tika:latest-full
    ports:
      - "9998:9998"
    restart: unless-stopped
```

### Comparativa de servicios

| Servicio | Licencia | Uso principal | Formatos | RAM mínima | Estructura semántica |
|----------|----------|---------------|----------|------------|---------------------|
| **LibreOffice headless** | MPL 2.0 | Conversión Office | 100+ | 1-4GB | ✅ Excelente |
| **Apache Tika** | Apache 2.0 | Extracción contenido | 1400+ | 1-4GB | ✅ Excelente |
| **Gotenberg** | MIT | Generación PDF | ~20 | 1-2GB | ⚠️ Conversión |
| **Pandoc** | GPL 2.0 | Conversión markup | 40+ | 100-500MB | ✅✅ Mejor |

**Pandoc destaca para preservación semántica** porque usa un AST (Abstract Syntax Tree) interno que mantiene la estructura del documento durante la conversión.

```typescript
// Integración Pandoc en Next.js API Route
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function convertWithPandoc(
  input: Buffer,
  fromFormat: string,
  toFormat: string
): Promise<string> {
  const { stdout } = await execAsync(
    `pandoc -f ${fromFormat} -t ${toFormat}`,
    { 
      input: input.toString(),
      maxBuffer: 50 * 1024 * 1024 // 50MB para documentos grandes
    }
  );
  return stdout;
}

// Ejemplo: DOCX → HTML con estructura preservada
const html = await convertWithPandoc(docxBuffer, 'docx', 'html5');
```

---

## Estrategia de fallback multinivel

```typescript
// lib/document-parser.ts
import mammoth from 'mammoth';
import pdf2md from '@opendocsg/pdf2md';
import { initEpubFile } from '@lingo-reader/epub-parser';
import libre from 'libreoffice-convert';
import { exec } from 'child_process';

type SupportedFormat = 'pdf' | 'docx' | 'doc' | 'rtf' | 'odt' | 'epub' | 'txt' | 'md';

interface ParseResult {
  html: string;
  markdown?: string;
  metadata?: Record<string, string>;
  warnings: string[];
  parserUsed: string;
}

export async function parseDocument(
  buffer: Buffer,
  format: SupportedFormat
): Promise<ParseResult> {
  const warnings: string[] = [];
  
  switch (format) {
    case 'pdf':
      return parsePDFWithFallback(buffer, warnings);
    
    case 'docx':
      return parseDOCXWithFallback(buffer, warnings);
    
    case 'doc':
      return parseDOCWithFallback(buffer, warnings);
    
    case 'rtf':
    case 'odt':
      return parseViaLibreOffice(buffer, format, warnings);
    
    case 'epub':
      return parseEPUBWithFallback(buffer, warnings);
    
    case 'md':
      return parseMarkdown(buffer);
    
    case 'txt':
      return { 
        html: `<pre>${buffer.toString('utf-8')}</pre>`,
        warnings: [],
        parserUsed: 'native'
      };
  }
}

async function parsePDFWithFallback(
  buffer: Buffer,
  warnings: string[]
): Promise<ParseResult> {
  try {
    // Nivel 1: pdf2md (mejor estructura)
    const markdown = await pdf2md(buffer);
    const html = markdownToHtml(markdown);
    return { html, markdown, warnings, parserUsed: '@opendocsg/pdf2md' };
  } catch (e) {
    warnings.push(`pdf2md failed: ${e.message}`);
    
    try {
      // Nivel 2: unpdf (texto plano con coordenadas)
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return { 
        html: `<div class="pdf-text">${text}</div>`,
        warnings,
        parserUsed: 'unpdf'
      };
    } catch (e2) {
      warnings.push(`unpdf failed: ${e2.message}`);
      
      // Nivel 3: Tika service (si disponible)
      if (process.env.TIKA_URL) {
        const response = await fetch(`${process.env.TIKA_URL}/tika`, {
          method: 'PUT',
          body: buffer,
          headers: { 'Accept': 'text/html' }
        });
        return {
          html: await response.text(),
          warnings,
          parserUsed: 'apache-tika'
        };
      }
      
      throw new Error('All PDF parsers failed');
    }
  }
}

async function parseDOCXWithFallback(
  buffer: Buffer,
  warnings: string[]
): Promise<ParseResult> {
  try {
    // Nivel 1: Mammoth con styleMap extendido
    const result = await mammoth.convertToHtml({ buffer }, {
      styleMap: bookStyleMap,
      includeDefaultStyleMap: true
    });
    
    if (result.messages.length > 0) {
      warnings.push(...result.messages.map(m => m.message));
    }
    
    return { html: result.value, warnings, parserUsed: 'mammoth' };
  } catch (e) {
    warnings.push(`Mammoth failed: ${e.message}`);
    
    try {
      // Nivel 2: docx-preview
      const { parseAsync } = await import('docx-preview');
      const doc = await parseAsync(buffer.buffer);
      // Renderizar a HTML string
      const html = await renderDocxToHtml(doc);
      return { html, warnings, parserUsed: 'docx-preview' };
    } catch (e2) {
      warnings.push(`docx-preview failed: ${e2.message}`);
      
      // Nivel 3: Pandoc
      const html = await convertWithPandoc(buffer, 'docx', 'html5');
      return { html, warnings, parserUsed: 'pandoc' };
    }
  }
}
```

---

## Consideraciones de rendimiento para documentos grandes

### Benchmarks aproximados (200+ páginas)

| Formato | Librería | Tiempo típico | Memoria pico | Notas |
|---------|----------|---------------|--------------|-------|
| **PDF 200pp** | pdf2md | 8-15s | 2-4GB | Requiere `--max-old-space-size=4096` |
| **PDF 200pp** | unpdf | 3-5s | 500MB-1GB | Solo texto |
| **DOCX 200pp** | mammoth | 2-4s | 300-500MB | Estable |
| **DOCX 200pp** | docx-preview | 4-8s | 500MB-1GB | Más completo |
| **EPUB 200pp** | @lingo-reader | 1-3s | 200-400MB | Eficiente |
| **Conversión LO** | libreoffice | 5-10s | 1-2GB | Cold start lento |

### Optimizaciones para Next.js 15

```typescript
// next.config.js - Aumentar límites para parsing
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  serverExternalPackages: [
    'mammoth',
    '@opendocsg/pdf2md',
    '@lingo-reader/epub-parser',
    'libreoffice-convert'
  ],
};
```

```typescript
// API Route con streaming para documentos grandes
// app/api/parse/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos para documentos grandes

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validar tamaño
  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large (max 100MB)' },
      { status: 413 }
    );
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const format = detectFormat(file.name);
  
  const result = await parseDocument(buffer, format);
  
  return NextResponse.json(result);
}
```

---

## Integración con Tiptap/ProseMirror

Para convertir el HTML parseado al schema de Tiptap:

```typescript
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

export function htmlToTiptapJSON(html: string) {
  return generateJSON(html, [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    // Agregar extensiones adicionales según necesidades
  ]);
}

// Uso después del parsing
const parseResult = await parseDocument(buffer, 'docx');
const tiptapContent = htmlToTiptapJSON(parseResult.html);
```

---

## Conclusiones y recomendaciones finales

**Para PDF**, la realidad técnica es que ninguna solución JavaScript puede extraer estructura semántica perfecta. `@opendocsg/pdf2md` ofrece la mejor aproximación heurística, pero considerar **Python (pymupdf, Docling) o APIs comerciales (LlamaParse)** para casos críticos.

**Para DOCX**, Mammoth.js con styleMap extendido cubre el 85% de casos. Usar docx-preview como fallback para documentos complejos con formato avanzado.

**Para formatos legacy (DOC, RTF, ODT)**, LibreOffice headless via Docker es la solución más robusta y confiable. Las librerías JavaScript nativas son inadecuadas para preservación semántica completa.

**Para EPUB**, `@lingo-reader/epub-parser` es claramente la mejor opción actual: moderna, mantenida activamente, y con soporte completo para EPUB 2 y 3.

La arquitectura recomendada para Anclora Press combina librerías JavaScript nativas para formatos bien soportados con servicios Docker (Gotenberg + Tika) como fallback universal, priorizando Pandoc cuando la preservación semántica es crítica.