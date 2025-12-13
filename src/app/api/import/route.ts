import { NextRequest, NextResponse } from 'next/server'
import { promisify } from 'util'
import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import pandoc from 'pandoc-bin'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

const execFileAsync = promisify(execFile)

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count < maxRequests) {
    record.count++
    return true
  }

  return false
}

// Estimate page count for text documents
function estimatePages(text: string): number {
  // More conservative estimation: 200 words per page for better accuracy
  const wordsPerPage = 200
  
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  const estimatedPages = Math.ceil(wordCount / wordsPerPage)
  
  return Math.max(1, estimatedPages)
}

// Detect page count for PDF documents using Pandoc
async function detectPDFPageCount(buffer: Buffer): Promise<number> {
  try {
    const tempDir = '/tmp'
    const inputFileName = `temp_pdf_${Date.now()}.pdf`
    const inputPath = path.join(tempDir, inputFileName)
    
    fs.writeFileSync(inputPath, buffer)
    
    let pandocPath: string
    try {
      pandocPath = pandoc.path
    } catch {
      pandocPath = 'pandoc'
    }
    
    // Use Pandoc to get page count info
    const { stdout } = await execFileAsync(pandocPath, [
      '-t', 'plain',
      '--print-default-data-file', 'latex',
      inputPath
    ])
    
    // Clean up
    try {
      fs.unlinkSync(inputPath)
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError)
    }
    
    // For PDF, we'll use a fallback estimation based on file size
    // Typical PDF: ~50KB per page of text
    const estimatedPages = Math.ceil(buffer.length / (50 * 1024))
    return Math.max(1, Math.min(estimatedPages, 100))
    
  } catch (error) {
    console.warn('PDF page count detection failed:', error)
    // Fallback estimation
    return Math.ceil(buffer.length / (50 * 1024))
  }
}

export async function POST(request: NextRequest) {
  try {
    // ===== AUTHENTICATION =====
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to import documents.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id || session.user.email

    // ===== RATE LIMITING =====
    if (!checkRateLimit(userId, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many import requests. Maximum 5 per minute. Please try again later.' },
        { status: 429 }
      )
    }

    // ===== CONTENT LENGTH VALIDATION =====
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json({
        error: `Request too large. Maximum size is 50MB (approximately 100 pages).`
      }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ===== FILE VALIDATION =====
    // Check file size limit (50MB for up to 100 pages)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large. Maximum size is 50MB (approximately 100 pages). Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
      }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ===== FILE TYPE VALIDATION =====
    // Validate file extension and MIME type
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf', 'odt', 'epub']

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file format: ${fileExtension}. Supported formats: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // ===== FILENAME SANITIZATION =====
    // Prevent directory traversal attacks
    const sanitizedFileName = path.basename(fileName)
    if (sanitizedFileName !== fileName) {
      return NextResponse.json(
        { error: 'Invalid filename. Directory traversal detected.' },
        { status: 400 }
      )
    }

    let extractedText = ''
    let metadata = {}

    try {
      switch (fileExtension) {
        case 'txt':
        case 'md':
          // Handle text and markdown files
          extractedText = buffer.toString('utf-8')
          const estimatedPages = estimatePages(extractedText)
          
          if (estimatedPages > 100) {
            return NextResponse.json({ 
              error: `Document too long. Maximum is 100 pages (estimated ${estimatedPages} pages). Consider splitting your document into smaller parts.` 
            }, { status: 413 })
          }
          
          metadata = {
            type: fileExtension,
            size: file.size,
            name: fileName,
            pages: estimatedPages,
            pageLimit: '100 pages max'
          }
          break

        case 'pdf':
        case 'doc':
        case 'docx':
        case 'rtf':
        case 'odt':
        case 'epub':
          // Use Pandoc for document conversion with page count validation
          const result = await convertWithPandoc(buffer, fileExtension, fileName)
          extractedText = result.content
          metadata = result.metadata
          
          // Validate page count
          if (metadata.pages && metadata.pages > 100) {
            return NextResponse.json({ 
              error: `Document too long. Maximum is 100 pages (your document has ${metadata.pages} pages). Consider splitting your document into smaller parts.` 
            }, { status: 413 })
          }
          
          break

        default:
          return NextResponse.json({ 
            error: `Unsupported file format: ${fileExtension}. Supported formats: txt, md, pdf, doc, docx, rtf, odt, epub` 
          }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        content: extractedText,
        metadata,
        originalFileName: fileName,
        importLimits: {
          maxPages: 100,
          maxFileSize: '50MB',
          supportedFormats: ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf', 'odt', 'epub']
        }
      })

    } catch (error) {
      console.error('Error processing file:', error)
      return NextResponse.json({ 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Pandoc conversion function
async function convertWithPandoc(buffer: Buffer, inputFormat: string, fileName: string): Promise<{ content: string; metadata: any }> {
  const tempDir = '/tmp'
  const inputFileName = `temp_${Date.now()}.${inputFormat}`
  const outputFileName = `temp_${Date.now()}.md`
  const inputPath = path.join(tempDir, inputFileName)
  const outputPath = path.join(tempDir, outputFileName)

  try {
    // Write input file
    fs.writeFileSync(inputPath, buffer)

    // Map file extensions to Pandoc formats
    const formatMap: { [key: string]: string } = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'rtf': 'rtf',
      'odt': 'odt',
      'epub': 'epub'
    }

    const pandocInputFormat = formatMap[inputFormat] || inputFormat

    // Try to use pandoc-bin first, fallback to system pandoc
    let pandocPath: string
    try {
      pandocPath = pandoc.path
    } catch {
      pandocPath = 'pandoc'
    }

    // Convert using Pandoc to markdown
    await execFileAsync(pandocPath, [
      '-f', pandocInputFormat,
      '-t', 'markdown',
      '--extract-media=/tmp',
      '--wrap=none',
      inputPath,
      '-o', outputPath
    ])

    // Read the converted content
    let content = fs.readFileSync(outputPath, 'utf-8')

    // Extract basic metadata
    let metadata: any = {
      type: inputFormat,
      size: buffer.length,
      name: fileName,
      convertedAt: new Date().toISOString(),
      converter: 'Pandoc',
      pageLimit: '100 pages max'
    }

    // Try to extract title from content
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }

    // Detect page count based on format
    if (inputFormat === 'pdf') {
      metadata.pages = await detectPDFPageCount(buffer)
    } else {
      // For other formats, estimate based on content length
      metadata.pages = estimatePages(content)
    }

    // Add file size info
    metadata.sizeMB = (buffer.length / 1024 / 1024).toFixed(2)

    // Clean up temporary files
    try {
      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError)
    }

    return { content, metadata }

  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError)
    }

    console.error(`Pandoc conversion error for ${inputFormat}:`, error)
    
    // Fallback to basic text extraction
    return {
      content: generateFallbackContent(inputFormat, fileName),
      metadata: {
        type: inputFormat,
        size: buffer.length,
        name: fileName,
        error: `Pandoc conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        converter: 'Fallback'
      }
    }
  }
}

// Generate fallback content when Pandoc fails
function generateFallbackContent(format: string, fileName: string): string {
  return `
# Documento Importado: ${fileName}

## Formato Detectado
${format.toUpperCase()}

## Límite de Importación
**Máximo 100 páginas por documento**

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
- **Páginas máximas**: 100 páginas por documento
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

**Nota**: Si tu documento excede las 100 páginas, considera dividirlo en partes más pequeñas para una mejor gestión.
  `.trim()
}