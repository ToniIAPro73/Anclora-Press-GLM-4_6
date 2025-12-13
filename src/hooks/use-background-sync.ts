/**
 * useBackgroundSync Hook
 * Automatically syncs pending changes to server in the background
 * Runs every 30 seconds when online
 */

import { useEffect, useState, useRef } from "react"
import { usePersistence } from "@/hooks/use-local-persistence"
import { StoredBook } from "@/lib/indexeddb-manager"

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  lastError: string | null
  pendingCount: number
}

/**
 * Hook that manages background sync to server
 * Usage:
 * const { syncStatus, retrySync } = useBackgroundSync()
 *
 * Shows sync status via UI:
 * {syncStatus.isSyncing && <p>Sincronizando...</p>}
 * {syncStatus.pendingCount > 0 && <p>Cambios pendientes: {syncStatus.pendingCount}</p>}
 */
export function useBackgroundSync() {
  const {
    getPendingChanges,
    markAsSynced,
    currentBook,
  } = usePersistence()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    lastError: null,
    pendingCount: 0,
  })

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Perform sync of pending changes
   */
  const performSync = async () => {
    // Don't sync if offline
    if (!syncStatus.isOnline) {
      return
    }

    setSyncStatus((prev) => ({
      ...prev,
      isSyncing: true,
      lastError: null,
    }))

    try {
      const pending = await getPendingChanges()
      setSyncStatus((prev) => ({
        ...prev,
        pendingCount: pending.length,
      }))

      if (pending.length === 0) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: new Date(),
        }))
        return
      }

      // Sync each pending book
      for (const book of pending) {
        try {
          const response = await fetch(`/api/books/${book.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: book.id,
              title: book.title,
              author: book.author,
              content: book.content,
              metadata: book.metadata,
              dirty: book.dirty,
              updatedAt: book.updatedAt,
            }),
          })

          if (response.ok) {
            // Mark as synced on successful save
            await markAsSynced(book.id)

            console.log(`[Sync] ✓ Book "${book.title}" synced successfully`)
          } else if (response.status === 409) {
            // Conflict detected
            const conflictData = await response.json()
            console.warn(
              `[Sync] ⚠️ Conflict for book "${book.title}":`,
              conflictData
            )
            // In Phase 3, show conflict resolution dialog
            // For now, server version wins (already handled in API)
          } else {
            const errorData = await response.json()
            throw new Error(
              errorData.error || `HTTP ${response.status}`
            )
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error"
          console.error(`[Sync] ✗ Failed to sync book "${book.title}":`, message)

          setSyncStatus((prev) => ({
            ...prev,
            lastError: `Failed to sync: ${message}`,
          }))
          // Continue with next book instead of stopping
        }
      }

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }))

      // Get updated pending count
      const updatedPending = await getPendingChanges()
      setSyncStatus((prev) => ({
        ...prev,
        pendingCount: updatedPending.length,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Sync] Unexpected error during sync:", message)

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: `Sync failed: ${message}`,
      }))
    }
  }

  /**
   * Manually retry sync (user-triggered)
   */
  const retrySync = async () => {
    await performSync()
  }

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Sync] Connection restored")
      setSyncStatus((prev) => ({
        ...prev,
        isOnline: true,
      }))
      // Immediately try to sync when coming online
      performSync()
    }

    const handleOffline = () => {
      console.log("[Sync] Connection lost")
      setSyncStatus((prev) => ({
        ...prev,
        isOnline: false,
      }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  /**
   * Set up periodic sync (every 30 seconds)
   */
  useEffect(() => {
    // Initial sync attempt
    performSync()

    // Set up interval for periodic sync
    syncIntervalRef.current = setInterval(() => {
      performSync()
    }, 30000) // 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncStatus.isOnline, currentBook])

  return {
    syncStatus,
    retrySync,
  }
}

/**
 * Hook variant that returns just the sync status
 * Simpler for components that just need status display
 */
export function useSyncStatus() {
  const { syncStatus } = useBackgroundSync()
  return syncStatus
}
