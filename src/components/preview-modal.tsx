"use client";

/**
 * @deprecated This component is deprecated. Use preview-modal-v2.tsx instead.
 * This version has multiple issues:
 * - Triple scroll vertical
 * - Cover page not displayed correctly
 * - No single/spread page mode
 * - Content requires internal scrolling
 * - No table of contents
 *
 * See ANALISIS_MEJORAS_PREVIEW_MODAL.md for details.
 */

import { useMemo } from "react";
import { X, Share, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PagedPreview from "@/components/paged-preview";

interface ChapterPreview {
  id?: string;
  title?: string;
  content?: string;
  order?: number;
  status?: string;
}

interface BookData {
  title: string;
  subtitle: string;
  author: string;
  content: string;
  template: string;
  coverImage: string | null;
  coverColor: string;
  genre: string;
  chapters?: ChapterPreview[];
}

interface PreviewModalProps {
  bookData: BookData;
  onClose: () => void;
}

export function buildPreviewMarkdown(book: BookData): string {
  const segments: string[] = [];

  const coverLines: string[] = [];
  if (book.coverImage) {
    coverLines.push(`![Portada generada](${book.coverImage})`);
  }
  if (book.title) {
    coverLines.push(`# ${book.title}`);
  }
  if (book.subtitle) {
    coverLines.push(`_${book.subtitle}_`);
  }
  if (book.author) {
    coverLines.push(`**${book.author}**`);
  }
  if (coverLines.length) {
    segments.push(coverLines.join("\n\n"));
  }

  const manuscriptContent = book.content?.trim();
  if (manuscriptContent) {
    segments.push(manuscriptContent);
  }

  if (book.chapters?.length) {
    const sortedChapters = [...book.chapters].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    sortedChapters.forEach((chapter, index) => {
      const chapterTitle = chapter.title?.trim() || `Capítulo ${index + 1}`;
      const chapterBody =
        chapter.content?.trim() || "_Contenido aún no disponible_";
      segments.push(`## ${chapterTitle}\n\n${chapterBody}`);
    });
  }

  return segments.length ? segments.join("\n\n") : "_Todavía no hay contenido para previsualizar._";
}

export default function PreviewModal({ bookData, onClose }: PreviewModalProps) {
  const previewMarkdown = useMemo(() => buildPreviewMarkdown(bookData), [bookData]);
  const totalChapters = bookData.chapters?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Vista previa</p>
          <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {bookData.title || "Libro sin título"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {bookData.author || "Autor desconocido"} · {totalChapters} capítulos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-muted/30">
        <Badge variant="secondary" className="text-xs">
          Plantilla: {bookData.template || "sin asignar"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Ajusta el zoom o el dispositivo con los controles superiores de la vista previa.
        </span>
      </div>

      <div className="flex-1 overflow-hidden bg-muted/20">
        <PagedPreview
          content={previewMarkdown}
          title={bookData.title || "Documento sin título"}
          author={bookData.author || "Autor desconocido"}
        />
      </div>
    </div>
  );
}
