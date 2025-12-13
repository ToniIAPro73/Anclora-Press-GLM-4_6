"use client"

/**
 * EditorWorkspace Component
 * Main editor layout integrating all components
 * Sidebar + Editor + Preview
 */

import React, { useState, useCallback } from "react"
import { usePersistence } from "@/hooks/use-local-persistence"
import BookManager from "@/components/book-manager"
import ChapterOrganizer from "@/components/chapter-organizer"
import EditorWithPersistence from "@/components/editor-with-persistence"
import PagedPreview from "@/components/paged-preview"
import DocumentImporter from "@/components/document-importer"
import PDFExportDialog from "@/components/pdf-export-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/hooks/use-language"
import {
  Download,
  Upload,
  Menu,
  X,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function EditorWorkspace() {
  const { currentBook, currentChapter } = usePersistence()
  const { t, mounted } = useLanguage()

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(true)

  // Get content to display (from chapter or book)
  const contentToDisplay = selectedChapterId
    ? currentChapter?.content || ""
    : currentBook?.content || ""

  const titleToDisplay = selectedChapterId
    ? currentChapter?.title || "Untitled Chapter"
    : currentBook?.title || "Untitled Book"

  const handleImportSuccess = useCallback(
    (data: { title: string; content: string; metadata: Record<string, any> }) => {
      setImportOpen(false)
      // Content is automatically loaded via usePersistence
    },
    []
  )

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-card border-r border-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Book Manager */}
          <div>
            <BookManager
              onBookSelect={(bookId) => {
                setSelectedChapterId(null)
              }}
            />
          </div>

          <Separator />

          {/* Chapter Organizer */}
          <div>
            <ChapterOrganizer
              bookId={currentBook?.id}
              onChapterSelect={(chapterId) => {
                setSelectedChapterId(chapterId)
              }}
            />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-4 flex items-center justify-between gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="gap-2"
          >
            <Menu className="h-4 w-4" />
            {sidebarOpen ? "Ocultar" : "Mostrar"}
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Preview Toggle */}
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={!currentBook}
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "Ocultar" : "Mostrar"} Vista Previa
            </Button>

            {/* Import Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setExportOpen(true)}
              disabled={!currentBook}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-4 p-4">
          {/* Editor */}
          <div className={cn("flex flex-col bg-card rounded-lg border border-border overflow-hidden", previewMode ? "flex-1" : "w-full")}>
            {currentBook ? (
              <EditorWithPersistence
                bookId={selectedChapterId ? undefined : currentBook?.id}
                chapterId={selectedChapterId || undefined}
                title={titleToDisplay}
                className="h-full overflow-auto"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Sin libro seleccionado</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Crea un nuevo libro o importa uno existente para comenzar a editar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewMode && currentBook && (
            <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
              <PagedPreview content={contentToDisplay} />
            </div>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <DocumentImporter
        onImportSuccess={handleImportSuccess}
        className="hidden"
      />

      {/* Render Import Dialog Overlay */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Importar Documento</h2>
                <button
                  onClick={() => setImportOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <DocumentImporter onImportSuccess={handleImportSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <PDFExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        content={contentToDisplay}
        title={currentBook?.title || "Untitled"}
        author={currentBook?.author || "Author"}
      />
    </div>
  )
}
