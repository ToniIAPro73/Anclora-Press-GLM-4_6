/**
 * EditorWithPersistence
 * Integrates TiptapEditor with IndexedDB auto-save
 * Ensures zero data loss via local-first architecture
 */

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { usePersistence, useAutoSave } from "@/hooks/use-local-persistence"
import TiptapEditor from "@/components/tiptap-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

interface EditorWithPersistenceProps {
  bookId?: string
  chapterId?: string
  title?: string
  onTitleChange?: (title: string) => void
  className?: string
}

export default function EditorWithPersistence({
  bookId,
  chapterId,
  title = "Untitled",
  onTitleChange,
  className,
}: EditorWithPersistenceProps) {
  const persistence = usePersistence()
  const { autoSave, hasPendingChanges } = useAutoSave()
  const [content, setContent] = useState("")
  const [displayTitle, setDisplayTitle] = useState(title)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Load content when bookId or chapterId changes
  useEffect(() => {
    async function loadContent() {
      try {
        if (bookId) {
          await persistence.loadBook(bookId)
          if (persistence.currentBook) {
            setContent(persistence.currentBook.content || "")
            setDisplayTitle(persistence.currentBook.title)
          }
        } else if (chapterId) {
          // Load specific chapter if chapterId provided
          const chapter = persistence.chapters.find((c) => c.id === chapterId)
          if (chapter) {
            setContent(chapter.content)
            setDisplayTitle(chapter.title)
          }
        }
      } catch (error) {
        console.error("Failed to load content:", error)
      }
    }

    loadContent()
  }, [bookId, chapterId])

  // Auto-save handler with debounce
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      setSaveStatus("saving")

      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      // Set new timeout for debounced auto-save
      const timeout = setTimeout(async () => {
        if (bookId && persistence.currentBook) {
          try {
            await autoSave("book", bookId, newContent)
            setLastSaveTime(new Date())
            setSaveStatus("saved")

            // Reset status after 2 seconds
            setTimeout(() => setSaveStatus("idle"), 2000)
          } catch (error) {
            console.error("Auto-save failed:", error)
            setSaveStatus("error")
          }
        }
      }, 5000) // 5 second debounce

      setAutoSaveTimeout(timeout)
    },
    [bookId, autoSave, persistence.currentBook, autoSaveTimeout]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  return (
    <div className={className}>
      {/* Header with title and save status */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => {
                setDisplayTitle(e.target.value)
                onTitleChange?.(e.target.value)
                if (bookId && persistence.currentBook) {
                  persistence.updateBook(bookId, { title: e.target.value })
                }
              }}
              className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-border focus:outline-none focus:border-primary w-full"
              placeholder="Document Title"
            />
          </div>
        </div>

        {/* Save status indicators */}
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <Badge variant="outline" className="gap-2">
              <Clock className="h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}

          {saveStatus === "saved" && lastSaveTime && (
            <Badge variant="outline" className="gap-2 border-green-500 text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              Saved at {lastSaveTime.toLocaleTimeString()}
            </Badge>
          )}

          {saveStatus === "error" && (
            <Badge variant="outline" className="gap-2 border-red-500 text-red-700">
              <AlertCircle className="h-3 w-3" />
              Save failed
            </Badge>
          )}

          {hasPendingChanges && (
            <Badge variant="outline" className="gap-2 border-amber-500 text-amber-700">
              <AlertCircle className="h-3 w-3" />
              Pending sync
            </Badge>
          )}
        </div>
      </div>

      {/* Error message if save failed */}
      {persistence.lastSaveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{persistence.lastSaveError}</AlertDescription>
        </Alert>
      )}

      {/* Main editor */}
      <TiptapEditor
        content={content}
        onChange={handleContentChange}
        placeholder={`Start writing your ${chapterId ? "chapter" : "document"}...`}
      />

      {/* Info box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
        <p>
          <strong>✓ Local-First Persistence:</strong> Your changes are automatically saved to
          your device (IndexedDB) every 5 seconds. Your work is safe even if you close the browser
          or lose internet connection.
        </p>
      </div>
    </div>
  )
}
