/**
 * IndexedDB Manager
 * Local-first persistence layer for documents and chapters
 * Ensures no data loss due to disconnection
 */

export interface StoredBook {
  id: string
  title: string
  author: string
  content: string
  metadata?: {
    wordCount?: number
    estimatedPages?: number
    headingCount?: number
    paragraphCount?: number
    importedAt?: number
    originalFileName?: string
    warnings?: string[]
  }
  updatedAt: number
  syncedAt?: number
  dirty: boolean // true if changes not synced to server
}

export interface StoredChapter {
  id: string
  bookId: string
  title: string
  content: string
  order: number
  updatedAt: number
  syncedAt?: number
  dirty: boolean
}

export interface StoredDraft {
  id: string
  bookId: string
  content: string
  autoSavedAt: number
  version: number
}

const DB_NAME = "AncloraPress"
const DB_VERSION = 1

const STORES = {
  BOOKS: "books",
  CHAPTERS: "chapters",
  DRAFTS: "drafts",
}

/**
 * Initialize IndexedDB with stores for books, chapters, and drafts
 */
export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.BOOKS)) {
        const bookStore = db.createObjectStore(STORES.BOOKS, { keyPath: "id" })
        bookStore.createIndex("dirty", "dirty", { unique: false })
        bookStore.createIndex("updatedAt", "updatedAt", { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.CHAPTERS)) {
        const chapterStore = db.createObjectStore(STORES.CHAPTERS, { keyPath: "id" })
        chapterStore.createIndex("bookId", "bookId", { unique: false })
        chapterStore.createIndex("dirty", "dirty", { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
        const draftStore = db.createObjectStore(STORES.DRAFTS, { keyPath: "id" })
        draftStore.createIndex("bookId", "bookId", { unique: false })
      }
    }
  })
}

/**
 * Get a single book from IndexedDB
 */
export async function getBook(bookId: string): Promise<StoredBook | undefined> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.BOOKS, "readonly")
    const store = transaction.objectStore(STORES.BOOKS)
    const request = store.get(bookId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Save or update a book in IndexedDB
 */
export async function saveBook(book: StoredBook): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.BOOKS, "readwrite")
    const store = transaction.objectStore(STORES.BOOKS)
    const request = store.put(book)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Get all books from IndexedDB
 */
export async function getAllBooks(): Promise<StoredBook[]> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.BOOKS, "readonly")
    const store = transaction.objectStore(STORES.BOOKS)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Get all unsynchronized books (dirty = true)
 */
export async function getUnsyncedBooks(): Promise<StoredBook[]> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.BOOKS, "readonly")
    const store = transaction.objectStore(STORES.BOOKS)
    const index = store.index("dirty")
    const request = index.getAll(true)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Delete a book from IndexedDB
 */
export async function deleteBook(bookId: string): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BOOKS, STORES.CHAPTERS, STORES.DRAFTS], "readwrite")

    // Delete book
    const bookStore = transaction.objectStore(STORES.BOOKS)
    bookStore.delete(bookId)

    // Delete associated chapters
    const chapterStore = transaction.objectStore(STORES.CHAPTERS)
    const chapterIndex = chapterStore.index("bookId")
    const chapterRange = IDBKeyRange.only(bookId)
    chapterIndex.openCursor(chapterRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    // Delete associated drafts
    const draftStore = transaction.objectStore(STORES.DRAFTS)
    const draftIndex = draftStore.index("bookId")
    const draftRange = IDBKeyRange.only(bookId)
    draftIndex.openCursor(draftRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Get chapters for a specific book
 */
export async function getChapters(bookId: string): Promise<StoredChapter[]> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CHAPTERS, "readonly")
    const store = transaction.objectStore(STORES.CHAPTERS)
    const index = store.index("bookId")
    const request = index.getAll(bookId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result.sort((a, b) => a.order - b.order)
      resolve(result)
    }
  })
}

/**
 * Save or update a chapter
 */
export async function saveChapter(chapter: StoredChapter): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CHAPTERS, "readwrite")
    const store = transaction.objectStore(STORES.CHAPTERS)
    const request = store.put(chapter)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Delete a chapter
 */
export async function deleteChapter(chapterId: string): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CHAPTERS, "readwrite")
    const store = transaction.objectStore(STORES.CHAPTERS)
    const request = store.delete(chapterId)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Save draft (auto-save checkpoint)
 */
export async function saveDraft(draft: StoredDraft): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.DRAFTS, "readwrite")
    const store = transaction.objectStore(STORES.DRAFTS)
    const request = store.put(draft)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Get latest draft for a book
 */
export async function getLatestDraft(bookId: string): Promise<StoredDraft | undefined> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.DRAFTS, "readonly")
    const store = transaction.objectStore(STORES.DRAFTS)
    const index = store.index("bookId")
    const request = index.getAll(bookId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const drafts = request.result.sort((a, b) => b.autoSavedAt - a.autoSavedAt)
      resolve(drafts[0])
    }
  })
}

/**
 * Clear old drafts, keeping only recent ones (for performance)
 */
export async function pruneDrafts(bookId: string, keepCount: number = 10): Promise<void> {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.DRAFTS, "readwrite")
    const store = transaction.objectStore(STORES.DRAFTS)
    const index = store.index("bookId")
    const request = index.getAll(bookId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const drafts = request.result.sort((a, b) => b.autoSavedAt - a.autoSavedAt)

      // Delete old drafts beyond keepCount
      for (let i = keepCount; i < drafts.length; i++) {
        store.delete(drafts[i].id)
      }

      transaction.oncomplete = () => resolve()
    }
  })
}

/**
 * Check if IndexedDB is available in this browser
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && !!window.indexedDB
}

/**
 * Get storage size statistics
 */
export async function getStorageStats(): Promise<{
  books: number
  chapters: number
  drafts: number
  totalSize: number
}> {
  try {
    const books = await getAllBooks()
    const allChapters: StoredChapter[] = []

    for (const book of books) {
      const chapters = await getChapters(book.id)
      allChapters.push(...chapters)
    }

    // Rough calculation of storage (actual IndexedDB usage varies by implementation)
    const estimate = {
      books: books.length,
      chapters: allChapters.length,
      drafts: 0,
      totalSize: JSON.stringify(books).length + JSON.stringify(allChapters).length,
    }

    return estimate
  } catch (error) {
    console.error("Failed to calculate storage stats:", error)
    return { books: 0, chapters: 0, drafts: 0, totalSize: 0 }
  }
}
