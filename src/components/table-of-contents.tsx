"use client";

/**
 * Table of Contents Component - FIXED VERSION
 * Displays chapter structure and allows quick navigation
 *
 * CHANGES:
 * 1. Shows: Portada → Índice → Preámbulo (if exists) → Chapters
 * 2. Correct page numbering
 * 3. Removed title page reference
 * 4. Better visual hierarchy
 */

import { useMemo } from "react";
import { List, BookMarked, FileText, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChapterPreview, PreviewPage, BookData } from "@/lib/preview-builder";

interface TOCItem {
  id: string;
  title: string;
  level: number; // 0 = special pages, 1 = chapters
  pageNumber: number; // 0-indexed for navigation
  displayPage: number; // 1-indexed for display
  icon?: "cover" | "toc" | "preface" | "chapter";
}

interface TableOfContentsProps {
  bookData: BookData;
  pages: PreviewPage[];
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
  className?: string;
}

export function TableOfContents({
  bookData,
  pages,
  currentPage,
  onNavigate,
  className,
}: TableOfContentsProps) {
  // Build TOC items from book data and pages
  const tocItems = useMemo(() => {
    const items: TOCItem[] = [];
    let pageIdx = 0;

    // ─────────────────────────────────────────────
    // PORTADA (Cover) - Always page 1
    // ─────────────────────────────────────────────
    items.push({
      id: "cover",
      title: "Portada",
      level: 0,
      pageNumber: pageIdx,
      displayPage: pageIdx + 1,
      icon: "cover",
    });
    pageIdx++;

    // ─────────────────────────────────────────────
    // ÍNDICE (TOC) - Page 2
    // ─────────────────────────────────────────────
    const tocPageIndex = pages.findIndex((p) => p.type === "toc");
    if (tocPageIndex !== -1) {
      items.push({
        id: "toc",
        title: "Índice",
        level: 0,
        pageNumber: tocPageIndex,
        displayPage: tocPageIndex + 1,
        icon: "toc",
      });
      pageIdx = tocPageIndex + 1;
    }

    // ─────────────────────────────────────────────
    // PREÁMBULO - If manuscript content exists
    // ─────────────────────────────────────────────
    const hasPreambulo = bookData.content?.trim();
    if (hasPreambulo) {
      // Find first content page (which would be preámbulo)
      const firstContentIdx = pages.findIndex((p) => p.type === "content");
      if (firstContentIdx !== -1) {
        items.push({
          id: "preambulo",
          title: "Preámbulo",
          level: 0,
          pageNumber: firstContentIdx,
          displayPage: firstContentIdx + 1,
          icon: "preface",
        });
      }
    }

    // ─────────────────────────────────────────────
    // CAPÍTULOS (Chapters)
    // ─────────────────────────────────────────────
    if (bookData.chapters && bookData.chapters.length > 0) {
      const sortedChapters = [...bookData.chapters].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      sortedChapters.forEach((chapter, idx) => {
        const chapterTitle = chapter.title?.trim() || `Capítulo ${idx + 1}`;

        // Find the page where this chapter appears by matching chapterTitle
        const chapterPageIdx = pages.findIndex(
          (p) => p.type === "content" && p.chapterTitle === chapterTitle
        );

        // Fallback: estimate page number based on position
        const estimatedPage = hasPreambulo
          ? 3 + idx // After cover, toc, preambulo
          : 2 + idx; // After cover, toc

        const finalPageNumber =
          chapterPageIdx !== -1 ? chapterPageIdx : estimatedPage;

        items.push({
          id: chapter.id || `chapter-${idx}`,
          title: chapterTitle,
          level: 1,
          pageNumber: finalPageNumber,
          displayPage: finalPageNumber + 1,
          icon: "chapter",
        });
      });
    }

    // ─────────────────────────────────────────────
    // CONTRAPORTADA (Back Cover) - Last page
    // ─────────────────────────────────────────────
    const backCoverPageIdx = pages.findIndex((p) => p.type === "back-cover");
    if (backCoverPageIdx !== -1) {
      items.push({
        id: "back-cover",
        title: "Contraportada",
        level: 0,
        pageNumber: backCoverPageIdx,
        displayPage: backCoverPageIdx + 1,
        icon: "cover",
      });
    }

    return items;
  }, [bookData, pages]);

  // Calculate stats
  const chapterCount = tocItems.filter((item) => item.level === 1).length;
  const totalSections = tocItems.length;

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
        <div className="p-2 space-y-0.5">
          {tocItems.length > 0 ? (
            tocItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(item.pageNumber)}
                className={cn(
                  "w-full justify-start text-left h-auto transition-colors rounded-md",
                  "hover:bg-muted",
                  // Current page highlight
                  currentPage === item.pageNumber &&
                    "bg-primary/10 text-primary",
                  // Level-based styling
                  item.level === 0 && "font-medium",
                  item.level === 1 && "pl-6"
                )}
              >
                <div className="flex items-center gap-2 py-1.5 px-2 w-full">
                  {/* Icon */}
                  <div className="shrink-0">
                    {item.icon === "cover" && (
                      <BookOpen className="h-3.5 w-3.5 opacity-60" />
                    )}
                    {item.icon === "toc" && (
                      <List className="h-3.5 w-3.5 opacity-60" />
                    )}
                    {item.icon === "preface" && (
                      <FileText className="h-3.5 w-3.5 opacity-60" />
                    )}
                    {item.icon === "chapter" && (
                      <BookMarked className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </div>

                  {/* Title and page */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "truncate text-sm",
                        item.level === 0 && "font-semibold"
                      )}
                    >
                      {item.title}
                    </div>
                  </div>

                  {/* Page number */}
                  <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {item.displayPage}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay contenido</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{chapterCount} capítulos</span>
          <span>{pages.length} páginas</span>
        </div>
      </div>
    </nav>
  );
}
