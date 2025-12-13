"use client";

/**
 * BookManager Component
 * Manages book list, creation, and deletion
 * Sidebar navigation for book selection
 */

import React, { useEffect, useState } from "react";
import { usePersistence } from "@/hooks/use-local-persistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BookManagerProps {
  onBookSelect?: (bookId: string) => void;
  className?: string;
}

export default function BookManager({
  onBookSelect,
  className,
}: BookManagerProps) {
  const {
    books,
    currentBook,
    loadAllBooks,
    loadBook,
    createBook,
    deleteBook,
    isSaving,
  } = usePersistence();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load all books on mount
  useEffect(() => {
    loadAllBooks();
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    try {
      setIsCreating(true);
      const book = await createBook(
        newBookTitle,
        newBookAuthor || "Author",
        ""
      );

      // Load the new book
      await loadBook(book.id);
      onBookSelect?.(book.id);

      // Reset form
      setNewBookTitle("");
      setNewBookAuthor("");
      setCreateOpen(false);
    } catch (error) {
      console.error("Failed to create book:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook(bookId);
      setDeleteOpen(null);
      // If the deleted book was selected, select the first available
      if (currentBook?.id === bookId && books.length > 0) {
        const firstBook = books[0];
        await loadBook(firstBook.id);
        onBookSelect?.(firstBook.id);
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  };

  const handleSelectBook = async (bookId: string) => {
    await loadBook(bookId);
    onBookSelect?.(bookId);
  };

  return (
    <div className={cn("w-full max-w-sm flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Mis Libros</h3>
        </div>
        <Badge variant="outline">{books.length}</Badge>
      </div>

      {/* Create Book Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2" disabled={isSaving || isCreating}>
            <Plus className="h-4 w-4" />
            Nuevo Libro
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Libro</DialogTitle>
            <DialogDescription>
              Ingresa el título y autor para comenzar un nuevo libro
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBook} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título *
              </label>
              <Input
                id="title"
                placeholder="Mi Novela"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="author" className="text-sm font-medium">
                Autor
              </label>
              <Input
                id="author"
                placeholder="Tu Nombre"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!newBookTitle.trim() || isCreating}
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

      {/* Books List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
        {books.length === 0 ? (
          <Card className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No hay libros. Crea uno para empezar.
            </p>
          </Card>
        ) : (
          books.map((book) => (
            <div
              key={book.id}
              className={cn(
                "p-3 rounded-lg border-2 transition-all cursor-pointer",
                currentBook?.id === book.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {/* Book Header */}
              <div
                className="flex items-start justify-between gap-2 mb-2"
                onClick={() => handleSelectBook(book.id)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{book.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {book.author}
                  </p>
                </div>
                {currentBook?.id === book.id && (
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>

              {/* Book Stats */}
              <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>
                    {book.metadata?.wordCount
                      ? `${(book.metadata.wordCount / 1000).toFixed(1)}K`
                      : "0 K"}{" "}
                    palabras
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(book.updatedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>

              {/* Book Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSelectBook(book.id)}
                  disabled={isSaving}
                >
                  Seleccionar
                </Button>

                <AlertDialog
                  open={deleteOpen === book.id}
                  onOpenChange={(open) => {
                    if (!open) setDeleteOpen(null);
                  }}
                >
                  <button
                    onClick={() => setDeleteOpen(book.id)}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar Libro</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar "{book.title}"?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteBook(book.id)}
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

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p>
          <strong>💾 Local-First:</strong> Los cambios se guardan
          automáticamente cada 5 segundos.
        </p>
      </div>
    </div>
  );
}
