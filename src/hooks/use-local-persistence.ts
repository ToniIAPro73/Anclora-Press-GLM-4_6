/**
 * useLocalPersistence Hook
 * Manages auto-save to IndexedDB with conflict detection
 * Provides reactive state management for books and chapters
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  initializeDB,
  saveBook,
  getBook,
  getAllBooks,
  getUnsyncedBooks,
  deleteBook,
  saveChapter,
  getChapters,
  deleteChapter,
  saveDraft,
  getLatestDraft,
  pruneDrafts,
  StoredBook,
  StoredChapter,
} from "@/lib/indexeddb-manager"
import { v4 as uuidv4 } from "uuid"

export interface PersistenceState {
  // Books
  currentBook: StoredBook | null
  books: StoredBook[]

  // Chapters
  currentChapter: StoredChapter | null
  chapters: StoredChapter[]

  // UI State
  isSaving: boolean
  lastSaveError: string | null
  hasPendingChanges: boolean

  // Actions - Book Management
  loadBook: (bookId: string) => Promise<void>
  createBook: (title: string, author: string, content: string, metadata?: any) => Promise<StoredBook>
  updateBook: (bookId: string, updates: Partial<StoredBook>) => Promise<void>
  deleteBook: (bookId: string) => Promise<void>
  loadAllBooks: () => Promise<void>

  // Actions - Chapter Management
  loadChapters: (bookId: string) => Promise<void>
  createChapter: (bookId: string, title: string, content: string, order: number) => Promise<StoredChapter>
  updateChapter: (chapterId: string, updates: Partial<StoredChapter>) => Promise<void>
  deleteChapter: (chapterId: string) => Promise<void>
  replaceChapters: (
    bookId: string,
    chapters: Array<{ title: string; content: string; order?: number }>
  ) => Promise<void>

  // Actions - Auto-save
  autoSaveContent: (type: "book" | "chapter", id: string, content: string) => Promise<void>

  // Actions - Sync
  getPendingChanges: () => Promise<StoredBook[]>
  markAsSynced: (id: string) => Promise<void>
}

const AUTOSAVE_INTERVAL = 5000 // 5 seconds
const DRAFT_PRUNE_THRESHOLD = 20 // Keep last 20 drafts per book

export const usePersistence = create<PersistenceState>()(
  devtools((set, get) => ({
    // Initial state
    currentBook: null,
    books: [],
    currentChapter: null,
    chapters: [],
    isSaving: false,
    lastSaveError: null,
    hasPendingChanges: false,

    // Load a single book and its chapters
    loadBook: async (bookId: string) => {
      try {
        set({ isSaving: true, lastSaveError: null })

        const book = await getBook(bookId)
        const chapters = await getChapters(bookId)

        if (book) {
          set({
            currentBook: book,
            chapters: chapters,
            isSaving: false,
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load book"
        set({
          lastSaveError: message,
          isSaving: false,
        })
      }
    },

    // Create a new book
    createBook: async (title: string, author: string, content: string, metadata?: any) => {
      try {
        const newBook: StoredBook = {
          id: uuidv4(),
          title,
          author,
          content,
          metadata,
          updatedAt: Date.now(),
          dirty: true,
        }

        await saveBook(newBook)

        set((state) => ({
          currentBook: newBook,
          books: [...state.books, newBook],
          hasPendingChanges: true,
        }))

        return newBook
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create book"
        set({ lastSaveError: message })
        throw error
      }
    },

    // Update a book
    updateBook: async (bookId: string, updates: Partial<StoredBook>) => {
      try {
        set({ isSaving: true, lastSaveError: null })

        const currentBook = get().currentBook
        if (!currentBook || currentBook.id !== bookId) {
          throw new Error("No book loaded")
        }

        const updatedBook: StoredBook = {
          ...currentBook,
          ...updates,
          updatedAt: Date.now(),
          dirty: true,
        }

        await saveBook(updatedBook)

        set((state) => ({
          currentBook: updatedBook,
          books: state.books.map((b) => (b.id === bookId ? updatedBook : b)),
          hasPendingChanges: true,
          isSaving: false,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update book"
        set({
          lastSaveError: message,
          isSaving: false,
        })
        throw error
      }
    },

    // Delete a book
    deleteBook: async (bookId: string) => {
      try {
        set({ isSaving: true, lastSaveError: null })

        await deleteBook(bookId)

        set((state) => ({
          currentBook: state.currentBook?.id === bookId ? null : state.currentBook,
          books: state.books.filter((b) => b.id !== bookId),
          chapters: [],
          isSaving: false,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete book"
        set({
          lastSaveError: message,
          isSaving: false,
        })
        throw error
      }
    },

    // Load all books
    loadAllBooks: async () => {
      try {
        set({ isSaving: true, lastSaveError: null })

        const books = await getAllBooks()
        set({
          books,
          isSaving: false,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load books"
        set({
          lastSaveError: message,
          isSaving: false,
        })
      }
    },

    // Load chapters for a book
    loadChapters: async (bookId: string) => {
      try {
        const chapters = await getChapters(bookId)
        set({ chapters })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load chapters"
        set({ lastSaveError: message })
      }
    },

    // Create a new chapter
    createChapter: async (bookId: string, title: string, content: string, order: number) => {
      try {
        const newChapter: StoredChapter = {
          id: uuidv4(),
          bookId,
          title,
          content,
          order,
          updatedAt: Date.now(),
          dirty: true,
        }

        await saveChapter(newChapter)

        set((state) => ({
          chapters: [...state.chapters, newChapter],
          hasPendingChanges: true,
        }))

        return newChapter
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create chapter"
        set({ lastSaveError: message })
        throw error
      }
    },

    // Update a chapter
    updateChapter: async (chapterId: string, updates: Partial<StoredChapter>) => {
      try {
        const chapters = get().chapters
        const currentChapter = chapters.find((c) => c.id === chapterId)
        if (!currentChapter) {
          throw new Error("Chapter not found")
        }

        const updatedChapter: StoredChapter = {
          ...currentChapter,
          ...updates,
          updatedAt: Date.now(),
          dirty: true,
        }

        await saveChapter(updatedChapter)

        set((state) => ({
          chapters: state.chapters.map((c) =>
            c.id === chapterId ? updatedChapter : c
          ),
          hasPendingChanges: true,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update chapter"
        set({ lastSaveError: message })
        throw error
      }
    },

    // Delete a chapter
    deleteChapter: async (chapterId: string) => {
      try {
        await deleteChapter(chapterId)

        set((state) => ({
          currentChapter:
            state.currentChapter?.id === chapterId ? null : state.currentChapter,
          chapters: state.chapters.filter((c) => c.id !== chapterId),
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete chapter"
        set({ lastSaveError: message })
        throw error
      }
    },

    // Replace all chapters for a book (used during imports)
    replaceChapters: async (
      bookId: string,
      chaptersPayload: Array<{ title: string; content: string; order?: number }>
    ) => {
      try {
        const existing = await getChapters(bookId)
        for (const chapter of existing) {
          await deleteChapter(chapter.id)
        }

        const newChapters: StoredChapter[] = []
        for (let i = 0; i < chaptersPayload.length; i++) {
          const payload = chaptersPayload[i]
          const chapter: StoredChapter = {
            id: uuidv4(),
            bookId,
            title: payload.title || `Capitulo ${i + 1}`,
            content: payload.content,
            order: payload.order ?? i,
            updatedAt: Date.now(),
            dirty: true,
          }

          await saveChapter(chapter)
          newChapters.push(chapter)
        }

        set((state) => ({
          chapters: newChapters,
          hasPendingChanges: newChapters.length > 0 ? true : state.hasPendingChanges,
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to replace chapters"
        set({ lastSaveError: message })
        throw error
      }
    },

    // Auto-save content (debounced in component using this hook)
    autoSaveContent: async (type: "book" | "chapter", id: string, content: string) => {
      try {
        set({ isSaving: true, lastSaveError: null })

        if (type === "book") {
          const book = get().currentBook
          if (book && book.id === id) {
            await get().updateBook(id, { content })

            // Save draft checkpoint
            await saveDraft({
              id: uuidv4(),
              bookId: id,
              content,
              autoSavedAt: Date.now(),
              version: 1,
            })

            // Prune old drafts
            await pruneDrafts(id, DRAFT_PRUNE_THRESHOLD)
          }
        } else if (type === "chapter") {
          const chapters = get().chapters
          const chapter = chapters.find((c) => c.id === id)
          if (chapter) {
            await get().updateChapter(id, { content })
          }
        }

        set({ isSaving: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Auto-save failed"
        set({
          lastSaveError: message,
          isSaving: false,
        })
        // Don't throw - auto-save failures shouldn't break the app
      }
    },

    // Get all pending changes for sync
    getPendingChanges: async () => {
      try {
        return await getUnsyncedBooks()
      } catch (error) {
        console.error("Failed to get pending changes:", error)
        return []
      }
    },

    // Mark a book as synced
    markAsSynced: async (bookId: string) => {
      try {
        const book = await getBook(bookId)
        if (book) {
          const syncedBook: StoredBook = {
            ...book,
            dirty: false,
            syncedAt: Date.now(),
          }
          await saveBook(syncedBook)

          set((state) => ({
            currentBook:
              state.currentBook?.id === bookId ? syncedBook : state.currentBook,
            books: state.books.map((b) => (b.id === bookId ? syncedBook : b)),
            hasPendingChanges: false,
          }))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to mark as synced"
        set({ lastSaveError: message })
      }
    },
  }))
)

/**
 * Hook to use local persistence with built-in auto-save
 * Usage:
 * ```
 * const { currentBook, autoSaveContent } = usePersistence()
 *
 * // Set up auto-save on content change
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     autoSaveContent("book", currentBook.id, content)
 *   }, 5000)
 *   return () => clearTimeout(timer)
 * }, [content])
 * ```
 */
export function useAutoSave() {
  const { autoSaveContent, currentBook, hasPendingChanges } = usePersistence()

  return {
    autoSave: autoSaveContent,
    currentBook,
    hasPendingChanges,
  }
}
