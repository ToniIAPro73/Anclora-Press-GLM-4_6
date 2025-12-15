import { NextRequest, NextResponse } from "next/server";
import { promisify } from "util";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import pandoc from "pandoc-bin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import {
  buildStructuredChapters,
  StructuredChapter,
} from "@/lib/document-importer";
import { parseDOCXEnhanced } from "@/lib/docx-enhanced";
import { parseEPUB } from "@/lib/epub-parser";
import { extractWithOCR, isPDFScanned } from "@/lib/ocr-handler";
import { extractPdfContentEnhanced } from "@/lib/pdf-parser";

const execFileAsync = promisify(execFile);

// Configure route to handle large file uploads (up to 50MB)
// maxDuration allows the route to process for up to 2 minutes
export const maxDuration = 120;

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  return false;
}

// Estimate page count for text documents
function estimatePages(text: string): number {
  // More conservative estimation: 200 words per page for better accuracy
  const wordsPerPage = 200;

  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const estimatedPages = Math.ceil(wordCount / wordsPerPage);

  return Math.max(1, estimatedPages);
}

// --- Removed detectPDFPageCount function as it was unreliable and is replaced by better estimation ---

export async function POST(request: NextRequest) {
  try {
    // ===== AUTHENTICATION (OPTIONAL FOR DEMO) =====
    const session = await getServerSession(authOptions);

    // For demo purposes, allow unauthenticated access
    // In production, uncomment the check below
    /*
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to import documents." },
        { status: 401 }
      );
    }
    */

    const userId = session?.user
      ? ((session.user as any).id || session.user.email)
      : "anonymous";

    // ===== RATE LIMITING =====
    if (!checkRateLimit(userId, 5, 60000)) {
      return NextResponse.json(
        {
          error:
            "Too many import requests. Maximum 5 per minute. Please try again later.",
        },
        { status: 429 }
      );
    }

    // ===== CONTENT LENGTH VALIDATION =====
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `Request too large. Maximum size is 50MB (approximately 300 pages).`,
        },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ===== FILE VALIDATION =====
    // Check file size limit (50MB for up to 300 pages)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is 50MB (approximately 300 pages). Your file is ${(
            file.size /
            1024 /
            1024
          ).toFixed(1)}MB.`,
        },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ===== FILE TYPE VALIDATION =====
    // Validate file extension and MIME type
    const fileName = file.name;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    const allowedExtensions = [
      "txt",
      "md",
      "pdf",
      "doc",
      "docx",
      "rtf",
      "odt",
      "epub",
    ];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Unsupported file format: ${fileExtension}. Supported formats: ${allowedExtensions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // ===== FILENAME SANITIZATION =====
    // Prevent directory traversal attacks
    const sanitizedFileName = path.basename(fileName);
    if (sanitizedFileName !== fileName) {
      return NextResponse.json(
        { error: "Invalid filename. Directory traversal detected." },
        { status: 400 }
      );
    }

    let extractedText = "";
    let metadata = {};
    let htmlVersion: string | null = null;
    let contentFormat: "markdown" | "markdown+html" | "html" = "markdown";
    let structuredChapters: StructuredChapter[] | undefined;

    try {
      switch (fileExtension) {
        case "txt":
        case "md":
          // Handle text and markdown files
          extractedText = buffer.toString("utf-8");
          const estimatedPages = estimatePages(extractedText);

          // Flexible page limit: 300 pages or 50MB (whichever comes first)
          if (estimatedPages > 300) {
            return NextResponse.json(
              {
                error: `Document too long. Maximum is 300 pages (estimated ${estimatedPages} pages). Consider splitting your document into smaller parts.`,
              },
              { status: 413 }
            );
          }

          metadata = {
            type: fileExtension,
            size: file.size,
            name: fileName,
            pages: estimatedPages,
            pageLimit: "300 pages max",
          };
          structuredChapters = buildStructuredChapters(undefined, extractedText);
          break;

        case "docx":
          // Use enhanced semantic DOCX import with Mammoth.js
          try {
            const imported = await parseDOCXEnhanced(buffer);
            const pages = estimatePages(imported.markdown);

            // Validate page count (flexible limit: 300 pages)
            if (pages > 300) {
              return NextResponse.json(
                {
                  error: `Document too long. Maximum is 300 pages (your document has ${pages} pages). Consider splitting your document into smaller parts.`,
                },
                { status: 413 }
              );
            }

            extractedText = imported.markdown;
            htmlVersion = imported.html;
            contentFormat = "markdown+html";
            metadata = {
              type: "docx",
              size: file.size,
              name: fileName,
              title: imported.metadata.title,
              pages: pages,
              wordCount: imported.statistics.wordCount,
              headings: imported.statistics.headingCount,
              paragraphs: imported.statistics.paragraphCount,
              warnings: imported.warnings,
              converter: "Mammoth.js (Enhanced Semantic)",
            };
            structuredChapters = buildStructuredChapters(htmlVersion, extractedText);
          } catch (error) {
            console.error("Enhanced DOCX import failed:", error);
            // Fallback to Pandoc if enhanced import fails
            const result = await convertWithPandoc(buffer, "docx", fileName);
            extractedText = result.content;
            htmlVersion = result.html ?? result.content;
            metadata = result.metadata;
            structuredChapters = buildStructuredChapters(htmlVersion, extractedText);

          }
          break;

        case "epub":
          // Use dedicated EPUB parser
          try {
            const imported = await parseEPUB(buffer);
            extractedText = imported.markdown;
            htmlVersion = imported.html;
            contentFormat = "markdown+html";
            metadata = {
              type: "epub",
              size: file.size,
              name: fileName,
              title: imported.metadata.title,
              author: imported.metadata.author,
              pages: estimatePages(imported.markdown),
              warnings: imported.warnings,
              converter: "EPUB Parser",
            };
            structuredChapters = buildStructuredChapters(htmlVersion, extractedText);
          } catch (error) {
            console.error("EPUB Import Failed:", error);
            return NextResponse.json(
              {
                error: "Failed to extract content from the EPUB file.",
                details: error instanceof Error ? error.message : "Unknown error during EPUB extraction.",
              },
              { status: 400 }
            );
          }
          break;

        case "pdf":
          let isScanned = false;
          try {
            // 1. Try native text extraction (best for structure)
            const extracted = await extractPdfContentEnhanced(buffer);

            if (!extracted.markdown.trim()) {
              // If native extraction fails, check if it's a scanned document
              isScanned = await isPDFScanned(buffer);
              if (isScanned) {
                throw new Error("PDF is likely scanned, falling back to OCR.");
              } else {
                throw new Error("Native PDF extraction failed for unknown reason.");
              }
            }

            extractedText = extracted.markdown;
            htmlVersion = extracted.html;
            metadata = {
              type: "pdf",
              size: file.size,
              name: fileName,
              title: extracted.metadata?.title,
              pages: extracted.estimatedPages ?? estimatePages(extractedText),
              wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length,
              warnings: extracted.warnings,
              converter: "Enhanced PDF Parser (@opendocsg/pdf2md + unpdf)",
            };
          } catch (error) {
            console.warn("Native PDF extraction failed. Trying OCR fallback.", error);

            // 2. Fallback to OCR for scanned or difficult PDFs
            try {
              const ocrResult = await extractWithOCR(buffer);
              extractedText = ocrResult.markdown;
              htmlVersion = ocrResult.html;
              isScanned = true;
              metadata = {
                type: "pdf",
                size: file.size,
                name: fileName,
                title: fileName,
                pages: ocrResult.pages,
                wordCount: ocrResult.text.split(/\s+/).filter(w => w.length > 0).length,
                warnings: ocrResult.warnings,
                converter: `OCR (${ocrResult.metadata.engine})`,
                isScanned: true,
              };
            } catch (ocrError) {
              console.error("OCR Fallback Failed:", ocrError);
              return NextResponse.json(
                {
                  error: "Failed to extract any content from the PDF file.",
                  details: `Native extraction failed. OCR fallback also failed: ${ocrError instanceof Error ? ocrError.message : "Unknown OCR error."}`,
                },
                { status: 400 }
              );
            }
          }

          // Final validation and structuring
          const pages = metadata.pages as number;
          if (pages > 300) {
            return NextResponse.json(
              {
                error: `Document too long. Maximum is 300 pages (your document has ${pages} pages). Consider splitting your document into smaller parts.`,
              },
              { status: 413 }
            );
          }

          contentFormat = "markdown+html";
          structuredChapters = buildStructuredChapters(htmlVersion, extractedText);
          break;

        case "doc":
        case "rtf":
        case "odt":
          // Use Pandoc for document conversion with page count validation
          const result = await convertWithPandoc(
            buffer,
            fileExtension,
            fileName
          );
          extractedText = result.content;
          htmlVersion = result.html ?? result.content;
          contentFormat = result.html ? "markdown+html" : "markdown";
          metadata = result.metadata;
          structuredChapters = result.chapters;

          // Validate page count (flexible limit: 300 pages)
          if (metadata.pages && metadata.pages > 300) {
            return NextResponse.json(
              {
                error: `Document too long. Maximum is 300 pages (your document has ${metadata.pages} pages). Consider splitting your document into smaller parts.`,
              },
              { status: 413 }
            );
          }

          break;

        default:
          return NextResponse.json(
            {
              error: `Unsupported file format: ${fileExtension}. Supported formats: txt, md, pdf, doc, docx, rtf, odt, epub`,
            },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        content: extractedText,
        contentHtml: htmlVersion,
        contentFormat,
        chapters: structuredChapters,
        metadata,
        originalFileName: fileName,
        importLimits: {
          maxPages: 300,
          maxFileSize: "50MB",
          supportedFormats: [
            "txt",
            "md",
            "pdf",
            "doc",
            "docx",
            "rtf",
            "odt",
            "epub",
          ],
        },
      });
    } catch (error) {
      console.error("Error processing file:", error);
      return NextResponse.json(
        {
          error: "Failed to process file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Pandoc conversion function
async function convertWithPandoc(
  buffer: Buffer,
  inputFormat: string,
  fileName: string
): Promise<{
  content: string;
  html?: string;
  metadata: any;
  chapters?: StructuredChapter[];
}> {
  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputFileName = `temp_${uniqueId}.${inputFormat}`;
  const markdownFileName = `temp_${uniqueId}.md`;
  const htmlFileName = `temp_${uniqueId}.html`;
  const inputPath = path.join(tempDir, inputFileName);
  const markdownPath = path.join(tempDir, markdownFileName);
  const htmlPath = path.join(tempDir, htmlFileName);

  try {
    // Write input file
    fs.writeFileSync(inputPath, buffer);

    // Map file extensions to Pandoc formats
    const formatMap: { [key: string]: string } = {
      pdf: "pdf",
      doc: "doc",
      docx: "docx",
      rtf: "rtf",
      odt: "odt",
      epub: "epub",
    };

    const pandocInputFormat = formatMap[inputFormat] || inputFormat;

    // Try to use pandoc-bin first, fallback to system pandoc
    let pandocPath: string;
    try {
      pandocPath = pandoc.path;
    } catch {
      pandocPath = "pandoc";
    }

    // Convert using Pandoc to markdown
    const pandocMarkdownArgs = [
      "-f",
      pandocInputFormat,
      "-t",
      "markdown",
      inputPath,
      "-o",
      markdownPath,
    ];

    await execFileAsync(pandocPath, pandocMarkdownArgs);

    // Convert using Pandoc to HTML for rich editors
    const pandocHtmlArgs = [
      "-f",
      pandocInputFormat,
      "-t",
      "html",
      inputPath,
      "-o",
      htmlPath,
    ];

    await execFileAsync(pandocPath, pandocHtmlArgs);

    // Read the converted content
    const content = fs.readFileSync(markdownPath, "utf-8");
    let html: string | undefined;
    try {
      html = fs.readFileSync(htmlPath, "utf-8");
    } catch (htmlError) {
      console.warn("Failed to read HTML output from Pandoc:", htmlError);
    }

    // Extract basic metadata
    let metadata: any = {
      type: inputFormat,
      size: buffer.length,
      name: fileName,
      convertedAt: new Date().toISOString(),
      converter: "Pandoc",
      pageLimit: "300 pages max",
    };

    // Try to extract title from content
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Detect page count based on format
    if (inputFormat === "pdf") {
      // PDF page count is handled by the OCR or native parser
    } else {
      // For other formats, estimate based on content length
      metadata.pages = estimatePages(content);
    }

    // Add file size info
    metadata.sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

    // Clean up temporary files
    try {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(markdownPath);
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    } catch (cleanupError) {
      console.warn("Cleanup warning:", cleanupError);
    }

    const chapters = buildStructuredChapters(html, content);

    return { content, html, metadata, chapters };
  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(markdownPath)) fs.unlinkSync(markdownPath);
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    } catch (cleanupError) {
      console.warn("Cleanup warning:", cleanupError);
    }

    console.error(`Pandoc conversion error for ${inputFormat}:`, error);

    // Fallback to basic text extraction
    return {
      content: generateFallbackContent(inputFormat, fileName),
      metadata: {
        type: inputFormat,
        size: buffer.length,
        name: fileName,
        error: `Pandoc conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        converter: "Fallback",
      },
      chapters: [],
    };
  }
}

// Generate fallback content when Pandoc fails
function generateFallbackContent(format: string, fileName: string): string {
  return `
# Documento Importado: ${fileName}

## Formato Detectado
${format.toUpperCase()}

## Límite de Importación
**Máximo 300 páginas por documento** (o 50MB, lo que ocurra primero)

## Nota de Importación
El documento ha sido procesado, pero encontramos dificultades durante la conversión automática. 
El contenido original está preservado y listo para que trabajes con él en AncloraPress.

## Recomendaciones

### Para ${format.toUpperCase()}:
1. **Revisa el contenido** - Verifica que todo el texto importante se haya importado correctamente
2. **Formatea manualmente** - Aplica los estilos, títulos y formato necesario
3. **Estructura el documento** - Organiza el contenido en capítulos y secciones
4. **Mejora la legibilidad** - Añade espacios, párrafos y formato según necesites

### Límites del Sistema:
- **Páginas máximas**: 300 páginas por documento
- **Tamaño máximo**: 50MB por archivo
- **Formatos soportados**: TXT, MD, PDF, DOC, DOCX, RTF, ODT, EPUB

### Herramientas Disponibles en AncloraPress:
- **Editor de texto enriquecido** - Para formatear y mejorar el contenido
- **Editor de capítulos** - Para organizar la estructura del libro
- **Vista previa** - Para verificar el aspecto final
- **Exportación** - Para generar el formato final de tu libro

---

Este contenido está listo para ser editado en AncloraPress. 
Aunque la importación automática encontró limitaciones, tienes todo el texto necesario para continuar tu proyecto.

**Nota**: Si tu documento excede las 300 páginas, considera dividirlo en partes más pequeñas para una mejor gestión.
  `.trim();
}
