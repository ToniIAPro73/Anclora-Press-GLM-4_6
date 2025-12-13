"use client"

import { useState, useRef } from "react"
import {
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TextEditorProps {
  content: string
  onChange: (content: string) => void
  title: string
  subtitle: string
  author: string
  onMetadataChange: (metadata: { title: string; subtitle: string; author: string }) => void
}

export default function TextEditor({
  content,
  onChange,
  title,
  subtitle,
  author,
  onMetadataChange,
}: TextEditorProps) {
  const [wordCount, setWordCount] = useState(content.split(/\s+/).filter(word => word.length > 0).length)
  const [charCount, setCharCount] = useState(content.length)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleContentChange = (newContent: string) => {
    onChange(newContent)
    setWordCount(newContent.split(/\s+/).filter(word => word.length > 0).length)
    setCharCount(newContent.length)
  }

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText = before + selectedText + after
    
    const newContent = content.substring(0, start) + newText + content.substring(end)
    handleContentChange(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**")
        break
      case "italic":
        insertText("*", "*")
        break
      case "heading":
        insertText("## ", "")
        break
      case "quote":
        insertText("> ", "")
        break
      case "list":
        insertText("- ", "")
        break
      case "ordered":
        insertText("1. ", "")
        break
      case "link":
        insertText("[", "](url)")
        break
      case "image":
        insertText("![alt text](", ")")
        break
    }
  }

  const canProceed = () => {
    return content.length > 100 && title.length > 0 && author.length > 0
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // If content is empty or very short, replace it. Otherwise, append.
        let newContent: string
        if (content.trim().length < 50) {
          // Replace content if it's essentially empty
          newContent = result.content
          setImportStatus({
            type: 'success',
            message: `Documento "${result.originalFileName}" importado y cargado como contenido principal`
          })
        } else {
          // Append to existing content
          newContent = content + '\n\n' + result.content
          setImportStatus({
            type: 'success',
            message: `Documento "${result.originalFileName}" añadido al contenido existente`
          })
        }
        
        handleContentChange(newContent)

        // Extract and update metadata from imported content
        if (result.metadata) {
          let updatedTitle = title
          let updatedAuthor = author
          let updatedSubtitle = subtitle

          // Try to extract title from imported content if no title exists
          if (!title && result.content) {
            const titleMatch = result.content.match(/^#\s+(.+)$/m)
            if (titleMatch) {
              updatedTitle = titleMatch[1].trim()
            } else {
              const firstLine = result.content.split('\n')[0].replace(/^#+\s*/, '').trim()
              if (firstLine.length > 0 && firstLine.length < 100) {
                updatedTitle = firstLine
              }
            }
          }

          // Update metadata if we found new information
          if (updatedTitle !== title || updatedAuthor !== author || updatedSubtitle !== subtitle) {
            onMetadataChange({ 
              title: updatedTitle, 
              subtitle: updatedSubtitle, 
              author: updatedAuthor 
            })
          }
        }

        // Show import details in console for debugging
        console.log('Import successful:', {
          fileName: result.originalFileName,
          pages: result.metadata?.pages,
          size: result.metadata?.sizeMB,
          contentLength: result.content.length
        })

      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Error al importar el documento'
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportStatus({
        type: 'error',
        message: 'Error de conexión al importar el documento'
      })
    } finally {
      setIsImporting(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearImportStatus = () => {
    setImportStatus({ type: null, message: '' })
  }

  const supportedFormats = [
    { ext: 'txt', name: 'Texto plano', icon: FileText },
    { ext: 'md', name: 'Markdown', icon: FileText },
    { ext: 'pdf', name: 'PDF', icon: File },
    { ext: 'doc', name: 'Word 97-2003', icon: File },
    { ext: 'docx', name: 'Word 2007+', icon: File },
    { ext: 'rtf', name: 'Rich Text', icon: File },
    { ext: 'odt', name: 'OpenDocument', icon: File },
    { ext: 'epub', name: 'eBook', icon: File }
  ]

  return (
    <div className="space-y-6">
      {/* Import Status Alert */}
      {importStatus.type && (
        <Alert className={importStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className="flex items-center space-x-2">
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className={importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {importStatus.message}
            </AlertDescription>
            <Button variant="ghost" size="sm" onClick={clearImportStatus}>
              ×
            </Button>
          </div>
        </Alert>
      )}

      {/* Import Section */}
      <Card className="surface-2">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Documento
          </CardTitle>
          <CardDescription>
            Importa contenido desde archivos existentes en múltiples formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx,.rtf,.odt,.epub"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
              id="file-import"
            />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {isImporting ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">
                  {isImporting ? 'Importando documento...' : 'Selecciona un archivo para importar'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isImporting 
                    ? 'Procesando el contenido del documento...' 
                    : 'Arrastra un archivo aquí o haz clic para seleccionar'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <File className="w-4 h-4 mr-2" />
                  Seleccionar Archivo
                </Button>
              </div>
            </div>
          </div>
          
          {/* Import Limits Info */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Límites de Importación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Páginas:</span>
                <span className="text-muted-foreground">Máx. 100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Tamaño:</span>
                <span className="text-muted-foreground">Máx. 50MB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Formatos:</span>
                <span className="text-muted-foreground">8 soportados</span>
              </div>
            </div>
          </div>
          
          {/* Supported Formats */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Formatos soportados:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {supportedFormats.map((format) => (
                <div key={format.ext} className="flex items-center space-x-2 p-2 border rounded-lg surface-1">
                  <format.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">.{format.ext}</div>
                    <div className="text-xs text-muted-foreground">{format.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <Card className="surface-2">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Información del Libro</CardTitle>
          <CardDescription>
            Añade los detalles básicos de tu libro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => onMetadataChange({ title: e.target.value, subtitle, author })}
                placeholder="El título de tu libro"
                className="surface-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => onMetadataChange({ title, subtitle, author: e.target.value })}
                placeholder="Tu nombre"
                className="surface-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => onMetadataChange({ title, subtitle: e.target.value, author })}
              placeholder="Un subtítulo descriptivo"
              className="surface-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Editor Toolbar */}
      <Card className="surface-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif">Contenido del Libro</CardTitle>
              <CardDescription>
                Escribe el contenido de tu libro usando formato Markdown
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {wordCount} palabras
              </Badge>
              <Badge variant="outline" className="text-xs">
                {charCount} caracteres
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="border-b border-border pb-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("bold")}
                  title="Negrita"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("italic")}
                  title="Cursiva"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("heading")}
                  title="Título"
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("list")}
                  title="Lista desordenada"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("ordered")}
                  title="Lista ordenada"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("quote")}
                  title="Cita"
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("link")}
                  title="Enlace"
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("image")}
                  title="Imagen"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-4">
            <Textarea
              id="content-textarea"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Comienza a escribir el contenido de tu libro...

Puedes usar formato Markdown:
## Títulos
**Texto en negrita**
*Texto en cursiva*
- Listas desordenadas
1. Listas ordenadas
> Citas

Escribe al menos 100 palabras para continuar al siguiente paso."
              className="min-h-[400px] resize-none surface-1 font-mono text-sm leading-relaxed"
            />
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {content.length < 100 
                  ? `Escribe ${100 - content.length} caracteres más para continuar` 
                  : "✓ Mínimo requerido completado"
                }
              </span>
              <span>{Math.round((content.length / 10000) * 100)}% del límite</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="surface-3 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Consejos para escribir mejor</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Usa títulos (##) para estructurar tu contenido en capítulos</li>
                <li>• Incluye subtítulos para organizar las secciones</li>
                <li>• Usa listas para presentar información de forma clara</li>
                <li>• Añade citas para destacar frases importantes</li>
                <li>• Revisa la ortografía y gramática antes de continuar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {!canProceed() && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <FileText className="w-4 h-4" />
              <span className="text-sm">
                Para continuar, asegúrate de tener al menos 100 caracteres de contenido, 
                un título y un autor.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}