"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"
import {
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Highlighter,
  Strikethrough,
  Superscript,
  Subscript,
  Table,
  Eye,
  Save,
  Undo,
  Redo,
  Search,
  Replace,
  Fullscreen,
  Minimize,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportedChapterPayload {
  title: string
  level: number
  html?: string
  markdown?: string
  wordCount?: number
}

interface EnhancedTextEditorProps {
  content: string
  onChange: (content: string) => void
  title: string
  subtitle: string
  author: string
  onMetadataChange: (metadata: { title: string; subtitle: string; author: string }) => void
  onChaptersDetected?: (chapters: ImportedChapterPayload[]) => void
}

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48]
const themes = [
  { id: 'light', name: 'Claro', bg: 'bg-white', text: 'text-gray-900' },
  { id: 'sepia', name: 'Sepia', bg: 'bg-amber-50', text: 'text-amber-900' },
  { id: 'dark', name: 'Oscuro', bg: 'bg-gray-900', text: 'text-gray-100' },
  { id: 'blue', name: 'Azul', bg: 'bg-blue-50', text: 'text-blue-900' }
]

export default function EnhancedTextEditor({
  content,
  onChange,
  title,
  subtitle,
  author,
  onMetadataChange,
  onChaptersDetected,
}: EnhancedTextEditorProps) {
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [wordCount, setWordCount] = useState(content.split(/\s+/).filter(word => word.length > 0).length)
  const [charCount, setCharCount] = useState(content.length)
  const [fontSize, setFontSize] = useState(16)
  const [theme, setTheme] = useState('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [history, setHistory] = useState<string[]>([content])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const openFileDialog = () => {
    if (isImporting) return
    fileInputRef.current?.click()
  }
  const normalizeImportedMarkdown = (markdown: string) => {
    return markdown.replace(/\\([\\`*_{}\[\]()#+\-.!<>~|])/g, "$1")
  }
  const WORDS_PER_PAGE = 200
  const MAX_PAGES = 300
  const estimatedPages = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE))
  const pageUsagePercent = Math.min(
    100,
    Math.round((estimatedPages / MAX_PAGES) * 100)
  )
  const exceedsPageLimit = estimatedPages > MAX_PAGES

  const handleContentChange = (newContent: string) => {
    onChange(newContent)
    setWordCount(newContent.split(/\s+/).filter(word => word.length > 0).length)
    setCharCount(newContent.length)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById("enhanced-content-textarea") as HTMLTextAreaElement
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
      case "underline":
        insertText("__", "__")
        break
      case "strikethrough":
        insertText("~~", "~~")
        break
      case "code":
        insertText("`", "`")
        break
      case "heading":
        insertText("## ", "")
        break
      case "subheading":
        insertText("### ", "")
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
      case "table":
        insertText("| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |")
        break
      case "highlight":
        insertText("==", "==")
        break
      case "superscript":
        insertText("^", "")
        break
      case "subscript":
        insertText("~", "")
        break
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }

  const searchInContent = () => {
    if (!searchTerm) return
    
    const textarea = document.getElementById("enhanced-content-textarea") as HTMLTextAreaElement
    if (!textarea) return
    
    const text = textarea.value
    const index = text.indexOf(searchTerm)
    
    if (index !== -1) {
      textarea.focus()
      textarea.setSelectionRange(index, index + searchTerm.length)
      textarea.scrollTop = textarea.scrollHeight
    }
  }

  const replaceInContent = () => {
    if (!searchTerm || !replaceTerm) return;

    const newContent = content.replaceAll(searchTerm, replaceTerm)
    handleContentChange(newContent)
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return;

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
        const normalizedContent = normalizeImportedMarkdown(result.content || "")
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
        if (Array.isArray(result.chapters) && result.chapters.length > 0) {
          onChaptersDetected?.(result.chapters)
        }

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

  const canProceed = () => {
    return content.length > 100 && title.length > 0 && author.length > 0
  }

  const currentTheme = themes.find((t) => t.id === theme)

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      <div className={`${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header with enhanced controls */}
        <Card className="surface-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-serif">{mounted ? t('editor.title') : 'Editor Avanzado'}</CardTitle>
                <CardDescription>
                  {mounted ? t('editor.description') : 'Herramientas profesionales para edición de contenido'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <span>Palabras:</span>
                  <Badge variant="secondary">{wordCount}</Badge>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <span>Caracteres:</span>
                  <Badge variant="outline">{charCount}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

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
              {mounted ? t('import.title') : 'Importar Documento'}
            </CardTitle>
            <CardDescription>
              {mounted ? t('import.description') : 'Importa contenido desde archivos existentes en el editor avanzado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor={importInputId}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block"
            >
              <input
                ref={fileInputRef}
                id={importInputId}
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx,.rtf,.odt,.epub"
                onChange={handleFileImport}
                disabled={isImporting}
                className="hidden"
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
                    {isImporting ? (mounted ? t('import.uploading') : 'Importando documento...') : 'Selecciona un archivo para importar'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isImporting
                      ? (mounted ? t('import.processing') : 'Procesando el contenido del documento...')
                      : (mounted ? t('import.dragdrop') : 'Arrastra un archivo aquí o haz clic para seleccionar')
                    }
                  </p>
                  <Button
                    variant="outline"
                    onClick={openFileDialog}
                    disabled={isImporting}
                  >
                    <File className="w-4 h-4 mr-2" />
                    {mounted ? t('import.select') : 'Seleccionar Archivo'}
                  </Button>
                </div>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Enhanced Toolbar */}
        <Card className="surface-2">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Undo/Redo */}
              <div className="flex items-center space-x-1 border-r pr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex === 0}
                  title="Deshacer"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                  title="Rehacer"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>

              {/* Text Formatting */}
              <div className="flex items-center space-x-1 border-r pr-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("underline")}
                  title="Subrayado"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("strikethrough")}
                  title="Tachado"
                >
                  <Strikethrough className="w-4 h-4" />
                </Button>
              </div>

              {/* Structure */}
              <div className="flex items-center space-x-1 border-r pr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("heading")}
                  title="Título"
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("subheading")}
                  title="Subtítulo"
                >
                  <Type className="w-4 h-4 text-sm" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("quote")}
                  title="Cita"
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("code")}
                  title="Código"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </div>

              {/* Lists */}
              <div className="flex items-center space-x-1 border-r pr-2">
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
              </div>

              {/* Insert */}
              <div className="flex items-center space-x-1 border-r pr-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("table")}
                  title="Tabla"
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>

              {/* Advanced */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("highlight")}
                  title="Resaltar"
                >
                  <Highlighter className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("superscript")}
                  title="Superíndice"
                >
                  <Superscript className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("subscript")}
                  title="Subíndice"
                >
                  <Subscript className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Editor Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Font Size */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Tamaño:</Label>
                  <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Tema:</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search/Replace */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  title="Buscar y reemplazar"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search/Replace Panel */}
            {showSearch && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Texto a buscar..."
                      className="surface-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replace">Reemplazar</Label>
                    <Input
                      id="replace"
                      value={replaceTerm}
                      onChange={(e) => setReplaceTerm(e.target.value)}
                      placeholder="Texto de reemplazo..."
                      className="surface-1"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button size="sm" onClick={searchInContent}>
                      <Search className="w-4 h-4 mr-2" />
                      {mounted ? t('search.button') : 'Buscar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={replaceInContent}>
                      <Replace className="w-4 h-4 mr-2" />
                      {mounted ? t('replace.button') : 'Reemplazar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Text Area */}
        <Card className={`surface-1 flex-1 ${isFullscreen ? 'overflow-hidden' : ''}`}>
          <CardContent className={`p-6 h-full ${isFullscreen ? 'flex flex-col' : ''}`}>
            <div className={`${currentTheme?.bg} ${currentTheme?.text} rounded-lg p-6 flex-1 ${isFullscreen ? 'overflow-auto' : ''}`}>
              <Textarea
                id="enhanced-content-textarea"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Comienza a escribir el contenido de tu libro...

Este editor avanzado incluye:
**Formato Markdown completo**
- Títulos (##, ###)
- **Negrita**, *cursiva*, ~~tachado~~
- `Código en línea`
- > Citas y bloques
- Listas ordenadas y desordenadas
- Enlaces [texto](url)
- Imágenes ![alt](url)
- Tablas | Col1 | Col2 |
- Resaltado ==texto==
- Superíndice^texto y subíndice~texto

Escribe al menos 100 palabras para continuar al siguiente paso."
                className={`w-full h-full resize-none font-mono leading-relaxed bg-transparent border-none focus:outline-none focus:ring-0`}
                style={{ fontSize: `${fontSize}px` }}
              />
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-sm mt-4">
              <span className={currentTheme?.text}>
                {content.length < 100 
                  ? `Escribe ${100 - content.length} caracteres más para continuar` 
                  : "✓ Mínimo requerido completado"
                }
              </span>
              <span className={currentTheme?.text}>
                {mounted
                  ? language === 'es'
                    ? exceedsPageLimit
                      ? `Estimado: ${estimatedPages} paginas — supera el limite de ${MAX_PAGES}. Maximo 50MB por documento`
                      : `Estimado: ${estimatedPages} paginas (${pageUsagePercent}% del limite de ${MAX_PAGES}). Maximo 50MB por documento`
                    : exceedsPageLimit
                      ? `Estimated: ${estimatedPages} pages — above the ${MAX_PAGES}-page limit. Max 50MB per document`
                      : `Estimated: ${estimatedPages} pages (${pageUsagePercent}% of the ${MAX_PAGES}-page limit). Max 50MB per document`
                  : 'Estimado: ' + estimatedPages}
              </span>
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
    </div>
  )
}
