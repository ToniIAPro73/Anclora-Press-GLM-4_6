"use client";

/**
 * Preview Modal V2 - Refactored
 * Complete book preview with paginated view, TOC, and device switching
 */

import { useMemo, useState, useCallback } from "react";
import { X, Share, Eye, List, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { CoverPage } from "@/components/cover-page";
import { TableOfContents } from "@/components/table-of-contents";
import { ViewModeToggle, ViewMode } from "@/components/view-mode-toggle";
import { DeviceSelector } from "@/components/device-selector";
import { PageRenderer } from "@/components/page-renderer";

import { buildPreviewPages } from "@/lib/preview-builder";
import { DEVICE_PAGINATION_CONFIGS, FORMAT_PRESETS, PreviewFormat } from "@/lib/device-configs";
import { BookData } from "@/lib/preview-builder";

interface PreviewModalV2Props {
  bookData: BookData;
  onClose: () => void;
}

export default function PreviewModalV2({ bookData, onClose }: PreviewModalV2Props) {
  // View state
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [format, setFormat] = useState<PreviewFormat>('laptop');
  const [zoom, setZoom] = useState(75);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Generate pages based on selected format
  const pages = useMemo(() => {
    const config = DEVICE_PAGINATION_CONFIGS[format];
    return buildPreviewPages(bookData, config);
  }, [bookData, format]);

  const totalPages = pages.length;

  // Navigation handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    const increment = viewMode === 'spread' ? 2 : 1;
    goToPage(currentPage + increment);
  }, [currentPage, viewMode, goToPage]);

  const prevPage = useCallback(() => {
    const decrement = viewMode === 'spread' ? 2 : 1;
    goToPage(currentPage - decrement);
  }, [currentPage, viewMode, goToPage]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevPage();
    } else if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'Home') {
      goToPage(0);
    } else if (e.key === 'End') {
      goToPage(totalPages - 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [prevPage, nextPage, goToPage, totalPages, onClose]);

  // Visible pages based on view mode
  const visiblePages = useMemo(() => {
    if (viewMode === 'single') {
      return pages[currentPage] ? [pages[currentPage]] : [];
    }
    // Spread mode: show two pages side by side
    const leftIdx = currentPage % 2 === 0 ? currentPage : currentPage - 1;
    return [pages[leftIdx], pages[leftIdx + 1]].filter(Boolean);
  }, [pages, currentPage, viewMode]);

  // Dimensions
  const preset = FORMAT_PRESETS[format];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3 bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle índice"
          >
            <List className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Vista Previa
            </p>
            <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {bookData.title || "Libro sin título"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{bookData.author || "Autor desconocido"}</span>
          <Badge variant="secondary">{bookData.chapters?.length || 0} capítulos</Badge>
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
      </header>

      {/* ═══════════════════════ TOOLBAR ═══════════════════════ */}
      <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-2 bg-muted/30">
        {/* Zoom controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
            title="Reducir zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            min={50}
            max={150}
            step={5}
            className="w-28"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            disabled={zoom >= 150}
            title="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
        </div>

        {/* Separator */}
        <div className="h-6 border-l border-border" />

        {/* View mode toggle */}
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

        {/* Separator */}
        <div className="h-6 border-l border-border" />

        {/* Device selector */}
        <DeviceSelector format={format} onFormatChange={setFormat} />

        {/* Export button */}
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* ═══════════════════════ MAIN CONTENT ═══════════════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar TOC */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-border shrink-0 bg-background">
            <TableOfContents
              chapters={bookData.chapters || []}
              pages={pages}
              currentPage={currentPage}
              onNavigate={goToPage}
            />
          </aside>
        )}

        {/* Preview area */}
        <main className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-hidden">
          <div
            className={cn(
              "flex transition-all duration-300",
              viewMode === 'spread' ? "gap-2" : "gap-0"
            )}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {visiblePages.length > 0 ? (
              visiblePages.map((page, idx) => (
                <PageRenderer
                  key={`page-${currentPage}-${idx}`}
                  page={page}
                  format={format}
                  bookData={bookData}
                />
              ))
            ) : (
              <div className="flex items-center justify-center text-muted-foreground">
                <p>No hay contenido para mostrar</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══════════════════════ PAGINATION BAR ═══════════════════════ */}
      <footer className="shrink-0 flex items-center justify-center gap-6 border-t border-border px-6 py-3 bg-background">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-2 text-sm">
          <span>Página</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage + 1}
            onChange={(e) => goToPage(Number(e.target.value) - 1)}
            className="w-16 text-center border border-border rounded px-2 py-1 bg-background"
          />
          <span>de {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </footer>
    </div>
  );
}
