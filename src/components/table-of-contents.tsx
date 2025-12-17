"use client";

/**
 * Table of Contents Component
 * Displays chapter structure and allows quick navigation
 */

import { useMemo } from 'react';
import { List, BookMarked } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChapterPreview, PreviewPage } from '@/lib/preview-builder';

interface TOCItem {
  id: string;
  title: string;
  level: number;
  pageNumber: number;
}

interface TableOfContentsProps {
  chapters: ChapterPreview[];
  pages: PreviewPage[];
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
  className?: string;
}

export function TableOfContents({
  chapters,
  pages,
  currentPage,
  onNavigate,
  className,
}: TableOfContentsProps) {
  // Build TOC items from chapters and pages
  const tocItems = useMemo(() => {
    const items: TOCItem[] = [];

    // Add cover
    items.push({
      id: 'cover',
      title: 'Portada',
      level: 0,
      pageNumber: 0,
    });

    // Add title page if exists
    const titlePageIndex = pages.findIndex(p => p.type === 'title');
    if (titlePageIndex !== -1) {
      items.push({
        id: 'title',
        title: 'Página de título',
        level: 0,
        pageNumber: titlePageIndex,
      });
    }

    // Add chapters
    if (chapters && chapters.length > 0) {
      chapters.forEach((chapter, idx) => {
        const chapterTitle = chapter.title?.trim() || `Capítulo ${idx + 1}`;

        // Find the page where this chapter appears
        const pageIndex = pages.findIndex(
          p => p.type === 'content' && p.chapterTitle === chapterTitle
        );

        items.push({
          id: chapter.id || `chapter-${idx}`,
          title: chapterTitle,
          level: 1,
          pageNumber: pageIndex !== -1 ? pageIndex : idx + 2,
        });
      });
    } else {
      // If no chapters, just add a "Content" entry
      const firstContentPage = pages.findIndex(p => p.type === 'content');
      if (firstContentPage !== -1) {
        items.push({
          id: 'content',
          title: 'Contenido',
          level: 1,
          pageNumber: firstContentPage,
        });
      }
    }

    return items;
  }, [chapters, pages]);

  return (
    <nav className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <List className="h-4 w-4" />
          Índice
        </h3>
      </div>

      {/* TOC Items */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {tocItems.length > 0 ? (
            tocItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(item.pageNumber)}
                className={cn(
                  "w-full justify-start text-left px-3 py-2 h-auto transition-colors",
                  currentPage === item.pageNumber && "bg-primary/10 text-primary font-medium",
                  item.level === 0 && "font-semibold",
                  item.level > 1 && `pl-${4 + item.level * 2}`
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Pág. {item.pageNumber + 1}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay capítulos</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{tocItems.length} secciones</span>
          <span>{pages.length} páginas</span>
        </div>
      </div>
    </nav>
  );
}
