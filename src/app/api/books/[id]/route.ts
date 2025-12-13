/**
 * Books Sync API Route
 * Handles book synchronization between client and server
 * PUT /api/books/:id - Sync book to server
 * GET /api/books/:id - Retrieve book from server
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * PUT /api/books/:id
 * Syncs a book from client to server
 *
 * Request body:
 * {
 *   id: string
 *   title: string
 *   author: string
 *   content: string
 *   metadata?: { wordCount, estimatedPages, etc }
 *   dirty: boolean (was it synced before?)
 *   updatedAt: number (timestamp of last client edit)
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validate request
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      )
    }

    // Check if this book already exists on server
    const existingBook = await db.post.findUnique({
      where: { id },
    })

    // Conflict detection: Compare timestamps
    let conflictDetected = false
    let resolutionChoice = "local" // Default: keep local version

    if (existingBook) {
      const clientTimestamp = body.updatedAt || Date.now()
      const serverTimestamp = existingBook.updatedAt.getTime()

      // If server version is newer, there's a conflict
      if (serverTimestamp > clientTimestamp) {
        conflictDetected = true
        // For now, server wins (last-write-wins strategy)
        // In Phase 3, we'd show a dialog to user
        resolutionChoice = "server"
      }
    }

    // Apply resolution strategy
    if (conflictDetected && resolutionChoice === "server") {
      // Return server version and indicate conflict
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          message: "Server has a newer version of this book",
          serverVersion: existingBook,
          clientVersion: body,
        },
        { status: 409 } // Conflict status code
      )
    }

    // Save or update book on server
    const book = await db.post.upsert({
      where: { id },
      update: {
        title: body.title,
        author: body.author || "Unknown Author",
        content: body.content,
        published: body.published || false,
        updatedAt: new Date(),
      },
      create: {
        id,
        title: body.title,
        author: body.author || "Unknown Author",
        content: body.content,
        published: body.published || false,
        authorId: session.user.email, // Use email as authorId for now
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Book synced successfully",
        data: {
          id: book.id,
          title: book.title,
          author: book.author,
          updatedAt: book.updatedAt.getTime(),
          syncedAt: Date.now(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Book sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync book" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/books/:id
 * Retrieves a book from server (for checking for conflicts)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    const book = await db.post.findUnique({
      where: { id },
    })

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: book.id,
          title: book.title,
          author: book.author,
          content: book.content,
          updatedAt: book.updatedAt.getTime(),
          createdAt: book.createdAt.getTime(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Get book error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve book" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/books/:id
 * Deletes a book from server
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    const book = await db.post.delete({
      where: { id },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Book deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Delete book error:", error)
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    )
  }
}
