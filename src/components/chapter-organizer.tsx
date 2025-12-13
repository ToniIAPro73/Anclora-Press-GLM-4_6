"use client"

/**
 * ChapterOrganizer Component
 * Manages chapters within a book
 * List, create, reorder, and delete chapters
 */

import React, { useEffect, useState } from "react"
import { usePersistence } from "@/hooks/use-local-persistence"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookMarked, Plus, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChapterOrganizerProps {
  bookId?: string
  onChapterSelect?: (chapterId: string) => void
  className?: string
}

export default function ChapterOrganizer({
  bookId,
  onChapterSelect,
  className,
}: ChapterOrganizerProps) {
  const {
    chapters,
    currentChapter,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    isSaving,
  } = usePersistence()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null)

  // Load chapters when bookId changes
  useEffect(() => {
    if (bookId) {
      loadChapters(bookId)
    }
  }, [bookId, loadChapters])

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookId || !newChapterTitle.trim()) return

    try {
      setIsCreating(true)
      const newOrder = Math.max(...chapters.map((c) => c.order), -1) + 1

      await createChapter(bookId, newChapterTitle, "", newOrder)
      setNewChapterTitle("")
      setCreateOpen(false)
    } catch (error) {
      console.error("Failed to create chapter:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectChapter = (chapterId: string) => {
    onChapterSelect?.(chapterId)
  }

  const handleReorderChapters = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= chapters.length) return

    const newChapters = [...chapters]
    const [moved] = newChapters.splice(fromIndex, 1)
    newChapters.splice(toIndex, 0, moved)

    // Update order for all chapters
    for (let i = 0; i < newChapters.length; i++) {
      const chapter = newChapters[i]
      if (chapter.order !== i) {
        await updateChapter(chapter.id, { order: i })
      }
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await deleteChapter(chapterId)
      setDeleteOpen(null)
      // If the deleted chapter was selected, select the first available
      if (currentChapter?.id === chapterId && chapters.length > 0) {
        const firstChapter = chapters[0]
        handleSelectChapter(firstChapter.id)
      }
    } catch (error) {
      console.error("Failed to delete chapter:", error)
    }
  }

  if (!bookId) {
    return (
      <div className={cn("w-full space-y-2", className)}>
        <div className="flex items-center gap-2 px-3 py-2">
          <BookMarked className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Selecciona un libro para ver capítulos</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Capítulos</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {chapters.length}
        </Badge>
      </div>

      {/* Create Chapter Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            disabled={isSaving || isCreating}
          >
            <Plus className="h-3 w-3" />
            Nuevo Capítulo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Capítulo</DialogTitle>
            <DialogDescription>
              Ingresa el título del nuevo capítulo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChapter} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="chapter-title" className="text-sm font-medium">
                Título del Capítulo *
              </label>
              <Input
                id="chapter-title"
                placeholder="Capítulo 1: El Comienzo"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!newChapterTitle.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? "Creando..." : "Crear"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chapters List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {chapters.length === 0 ? (
          <Card className="p-4 text-center">
            <BookMarked className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">
              No hay capítulos. Crea uno para comenzar.
            </p>
          </Card>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              draggable
              onDragStart={() => setDraggedChapter(chapter.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedChapter && draggedChapter !== chapter.id) {
                  const draggedIndex = chapters.findIndex((c) => c.id === draggedChapter)
                  handleReorderChapters(draggedIndex, index)
                  setDraggedChapter(null)
                }
              }}
              className={cn(
                "p-3 rounded-md border transition-all cursor-move group",
                currentChapter?.id === chapter.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
                draggedChapter === chapter.id && "opacity-50 bg-muted"
              )}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleSelectChapter(chapter.id)}
                    className="flex-1 text-left hover:underline"
                  >
                    <h5 className="text-sm font-medium truncate">{chapter.title}</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Capítulo {index + 1}
                      {chapter.updatedAt && ` • Actualizado`}
                    </p>
                  </button>
                </div>

                <AlertDialog open={deleteOpen === chapter.id} onOpenChange={(open) => {
                  if (!open) setDeleteOpen(null)
                }}>
                  <button
                    onClick={() => setDeleteOpen(chapter.id)}
                    className="inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    disabled={isSaving}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar Capítulo</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar "{chapter.title}"?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-900">
        <p>💡 Arrastra y suelta para reordenar capítulos</p>
      </div>
    </div>
  )
}
