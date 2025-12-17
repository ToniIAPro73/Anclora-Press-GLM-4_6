# Análisis Técnico: Mejoras del Visor de Vista Previa - Anclora Press GLM

**Fecha:** 2025-12-17  
**Versión:** 1.0  
**Componentes analizados:** `preview-modal.tsx`, `paged-preview.tsx`

---

## 1. Resumen Ejecutivo

El visor de vista previa actual presenta deficiencias críticas en la experiencia de usuario que impiden una previsualización efectiva del libro. Este documento detalla los problemas identificados, su causa raíz en el código, y las soluciones técnicas propuestas para cada uno.

---

## 2. Problemas Identificados

### 2.1 Problema: Triple Scroll Vertical

**Descripción:**  
El modal de vista previa genera tres barras de scroll verticales simultáneas, lo que dificulta la navegación y rompe la experiencia de usuario.

**Causa raíz en el código:**

```tsx
// preview-modal.tsx - Línea 31619
<div className="fixed inset-0 z-50 flex flex-col bg-background">
  // Header...
  <div className="flex-1 overflow-hidden bg-muted/20">  // ← Scroll #1
    <PagedPreview ... />
  </div>
</div>

// paged-preview.tsx - Línea 31073
<div className={cn("flex flex-col h-full bg-muted/20 rounded-lg border", className)}>
  // Toolbar...
  <div className="flex-1 overflow-auto bg-muted/30 p-8 flex justify-center">  // ← Scroll #2
    <iframe
      style={{
        height: `${computedHeight}px`,  // ← Scroll #3 dentro del iframe
      }}
    />
  </div>
</div>
```

**Impacto:**  
Confusión del usuario al no saber qué scroll controlar; experiencia visual degradada.

---

### 2.2 Problema: Portada No Visible Correctamente

**Descripción:**  
La portada generada no se visualiza como una página de portada real. Aparece como texto markdown crudo con la imagen en base64 visible.

**Causa raíz en el código:**

```tsx
// preview-modal.tsx - Línea 31574-31592
export function buildPreviewMarkdown(book: BookData): string {
  const coverLines: string[] = [];
  if (book.coverImage) {
    coverLines.push(`![Portada generada](${book.coverImage})`); // ← Markdown crudo
  }
  if (book.title) {
    coverLines.push(`# ${book.title}`);
  }
  // ...
}
```

El contenido se construye como markdown y luego se convierte a HTML básico sin estilos de portada dedicados.

---

### 2.3 Problema: Ausencia de Modo 1 Página / 2 Páginas

**Descripción:**  
No existe la opción de visualizar el libro en modo página simple o doble página (spread view).

**Causa raíz:**  
El componente `PagedPreview` renderiza el contenido en un único iframe con scroll continuo. No implementa paginación visual ni la posibilidad de mostrar dos páginas contiguas.

```tsx
// paged-preview.tsx - No existe esta funcionalidad
// Solo hay un iframe único sin controles de paginación
```

---

### 2.4 Problema: Contenido Requiere Scroll Interno

**Descripción:**  
Independientemente del dispositivo seleccionado (Laptop, Tablet, Móvil, eBook), el contenido del libro requiere scroll vertical para verse completo.

**Causa raíz:**

```tsx
// paged-preview.tsx - Línea 30810-30813
const computedHeight =
  pageCount > 0
    ? Math.max(singlePageHeight + 200, pageCount * singlePageHeight + 200)
    : singlePageHeight + 200;
```

La altura del iframe se calcula multiplicando todas las páginas, creando un documento continuo en lugar de páginas discretas navegables.

---

### 2.5 Problema: Ausencia de Índice/TOC en el Visor

**Descripción:**  
No existe un panel lateral que muestre la estructura del libro (índice de contenidos) para navegación rápida entre capítulos.

**Causa raíz:**  
El componente no extrae ni muestra la estructura de capítulos del contenido.

---

## 3. Arquitectura Propuesta

### 3.1 Diagrama de Componentes Refactorizado

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         PreviewModal (Contenedor)                       │
│  ┌─────────────────────────────────────────────────────────────────────┤
│  │                           Header Bar                                 │
│  │  [Título] [Autor] [Capítulos]                    [Compartir] [Cerrar]│
│  ├─────────────────────────────────────────────────────────────────────┤
│  │                          Toolbar Bar                                 │
│  │  [Zoom -][===][Zoom +]  |  [1 pág][2 págs]  |  Devices  |  [Export] │
│  ├──────────┬──────────────────────────────────────────────────────────┤
│  │   TOC    │                   Preview Area                           │
│  │  Sidebar │   ┌─────────────────────────────────────────────────┐    │
│  │          │   │                                                 │    │
│  │ ○ Cap 1  │   │         [Página Actual] [Página Siguiente]      │    │
│  │ ○ Cap 2  │   │         (Modo 1 página)  o  (Modo 2 páginas)    │    │
│  │ ○ Cap 3  │   │                                                 │    │
│  │ ...      │   └─────────────────────────────────────────────────┘    │
│  │          │                                                          │
│  ├──────────┴──────────────────────────────────────────────────────────┤
│  │                         Pagination Bar                              │
│  │              [◀ Anterior]   Página 3 de 45   [Siguiente ▶]          │
│  └─────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Soluciones Técnicas Detalladas

### 4.1 Solución: Eliminación de Scrolls Múltiples

**Estrategia:**  
Implementar un sistema de scroll único controlado a nivel del contenedor principal, con contenido paginado que no requiera scroll interno.

**Implementación:**

```tsx
// preview-modal.tsx - Refactorizado
export default function PreviewModal({ bookData, onClose }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header - Altura fija */}
      <header className="shrink-0 border-b border-border px-6 py-4">
        {/* ... */}
      </header>

      {/* Toolbar - Altura fija */}
      <div className="shrink-0 border-b border-border px-6 py-3 bg-muted/30">
        {/* ... */}
      </div>

      {/* Contenido Principal - Sin scroll propio */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar TOC */}
        <aside className="w-64 border-r border-border overflow-y-auto shrink-0">
          <TableOfContents chapters={bookData.chapters} />
        </aside>

        {/* Área de Preview - Paginación sin scroll */}
        <main className="flex-1 flex flex-col min-w-0">
          <PagedPreviewRefactored
            content={previewMarkdown}
            viewMode={viewMode} // 'single' | 'spread'
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </main>
      </div>

      {/* Pagination Bar - Altura fija */}
      <footer className="shrink-0 border-t border-border px-6 py-3">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </footer>
    </div>
  );
}
```

---

### 4.2 Solución: Portada Visual Correcta

**Estrategia:**  
Crear un componente dedicado `CoverPage` que renderice la portada con estilos apropiados, separado del contenido markdown.

**Implementación:**

```tsx
// components/cover-page.tsx - Nuevo componente
interface CoverPageProps {
  title: string;
  subtitle?: string;
  author: string;
  coverImage: string | null;
  coverColor: string;
  devicePreset: PreviewFormat;
}

export function CoverPage({
  title,
  subtitle,
  author,
  coverImage,
  coverColor,
  devicePreset,
}: CoverPageProps) {
  const dimensions = FORMAT_PRESETS[devicePreset];

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center"
      style={{
        width: dimensions.viewportWidth,
        height: dimensions.pagePixelHeight,
        backgroundColor: coverImage ? "transparent" : coverColor,
      }}
    >
      {coverImage && (
        <img
          src={coverImage}
          alt="Portada del libro"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="relative z-10 p-8 space-y-6">
        <h1 className="text-4xl font-serif font-bold text-white drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl italic text-white/90 drop-shadow">{subtitle}</p>
        )}
        <p className="text-lg text-white/80 mt-auto">{author}</p>
      </div>
    </div>
  );
}
```

**Integración en buildPreviewPages:**

```tsx
// Función actualizada para generar páginas discretas
export function buildPreviewPages(book: BookData): PreviewPage[] {
  const pages: PreviewPage[] = [];

  // Página 0: Portada
  pages.push({
    type: "cover",
    content: null,
    coverData: {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      coverImage: book.coverImage,
      coverColor: book.coverColor,
    },
  });

  // Página 1: Página de título (opcional)
  pages.push({
    type: "title",
    content: `<div class="title-page"><h1>${book.title}</h1><p>${book.author}</p></div>`,
  });

  // Páginas de contenido
  const contentPages = paginateContent(book.content, book.chapters);
  pages.push(...contentPages);

  return pages;
}
```

---

### 4.3 Solución: Modo 1 Página / 2 Páginas

**Estrategia:**  
Implementar un sistema de paginación con dos modos de visualización.

**Implementación del estado y controles:**

```tsx
// types/preview.ts
type ViewMode = "single" | "spread";

interface PreviewState {
  currentPage: number;
  viewMode: ViewMode;
  zoom: number;
  format: PreviewFormat;
}

// paged-preview-refactored.tsx
export default function PagedPreviewRefactored({
  pages,
  viewMode,
  currentPage,
  format,
  zoom,
  onPageChange,
}: PagedPreviewRefactoredProps) {
  const formatPreset = FORMAT_PRESETS[format];
  const scaledWidth = formatPreset.viewportWidth * (zoom / 100);
  const scaledHeight = formatPreset.pagePixelHeight * (zoom / 100);

  // Determinar qué páginas mostrar
  const visiblePages = useMemo(() => {
    if (viewMode === "single") {
      return [pages[currentPage]];
    }
    // Modo spread: páginas pares a la izquierda, impares a la derecha
    const leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
    const rightPage = leftPage + 1;
    return [pages[leftPage] || null, pages[rightPage] || null].filter(Boolean);
  }, [pages, currentPage, viewMode]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
      <div
        className={cn(
          "flex gap-4 transition-all duration-300",
          viewMode === "spread" && "gap-1" // Páginas juntas en spread
        )}
      >
        {visiblePages.map((page, idx) => (
          <PageRenderer
            key={`${currentPage}-${idx}`}
            page={page}
            width={scaledWidth}
            height={scaledHeight}
            format={format}
          />
        ))}
      </div>
    </div>
  );
}
```

**Controles de modo de vista:**

```tsx
// components/view-mode-toggle.tsx
interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === "single" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("single")}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs">1 Página</span>
      </Button>
      <Button
        variant={viewMode === "spread" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("spread")}
        className="gap-2"
      >
        <BookOpen className="h-4 w-4" />
        <span className="text-xs">2 Páginas</span>
      </Button>
    </div>
  );
}
```

---

### 4.4 Solución: Contenido Sin Scroll Por Dispositivo

**Estrategia:**  
Implementar paginación real del contenido basada en las dimensiones del dispositivo seleccionado, calculando cuánto contenido cabe en cada página.

**Implementación del paginador de contenido:**

```tsx
// lib/content-paginator.ts
interface PaginationConfig {
  pageWidth: number; // px
  pageHeight: number; // px
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  lineHeight: number;
}

interface ContentPage {
  type: "content";
  html: string;
  chapterTitle?: string;
  pageNumber: number;
}

export function paginateContent(
  htmlContent: string,
  config: PaginationConfig
): ContentPage[] {
  // Crear un contenedor temporal oculto para medir
  const measureContainer = document.createElement("div");
  measureContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${config.pageWidth - config.marginLeft - config.marginRight}px;
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight};
  `;
  document.body.appendChild(measureContainer);

  // Parsear el HTML en nodos
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const nodes = Array.from(doc.body.childNodes);

  const pages: ContentPage[] = [];
  let currentPageContent: Node[] = [];
  let currentHeight = 0;
  const availableHeight =
    config.pageHeight - config.marginTop - config.marginBottom;
  let currentChapter = "";

  for (const node of nodes) {
    // Detectar cambio de capítulo
    if (node.nodeName === "H1" || node.nodeName === "H2") {
      currentChapter = (node as Element).textContent || "";
    }

    // Medir altura del nodo
    measureContainer.innerHTML = "";
    measureContainer.appendChild(node.cloneNode(true));
    const nodeHeight = measureContainer.offsetHeight;

    if (
      currentHeight + nodeHeight > availableHeight &&
      currentPageContent.length > 0
    ) {
      // Crear nueva página con el contenido actual
      const pageDiv = document.createElement("div");
      currentPageContent.forEach((n) => pageDiv.appendChild(n.cloneNode(true)));

      pages.push({
        type: "content",
        html: pageDiv.innerHTML,
        chapterTitle: currentChapter,
        pageNumber: pages.length + 1,
      });

      // Resetear para siguiente página
      currentPageContent = [node.cloneNode(true)];
      currentHeight = nodeHeight;
    } else {
      currentPageContent.push(node.cloneNode(true));
      currentHeight += nodeHeight;
    }
  }

  // Última página
  if (currentPageContent.length > 0) {
    const pageDiv = document.createElement("div");
    currentPageContent.forEach((n) => pageDiv.appendChild(n.cloneNode(true)));
    pages.push({
      type: "content",
      html: pageDiv.innerHTML,
      chapterTitle: currentChapter,
      pageNumber: pages.length + 1,
    });
  }

  document.body.removeChild(measureContainer);
  return pages;
}
```

**Configuración por dispositivo:**

```tsx
// lib/device-configs.ts
export const DEVICE_PAGINATION_CONFIGS: Record<
  PreviewFormat,
  PaginationConfig
> = {
  laptop: {
    pageWidth: 576, // 6in * 96dpi
    pageHeight: 864, // 9in * 96dpi
    marginTop: 72,
    marginBottom: 72,
    marginLeft: 72,
    marginRight: 72,
    fontSize: 16,
    lineHeight: 1.6,
  },
  tablet: {
    pageWidth: 528,
    pageHeight: 816,
    marginTop: 64,
    marginBottom: 64,
    marginLeft: 48,
    marginRight: 48,
    fontSize: 15,
    lineHeight: 1.5,
  },
  mobile: {
    pageWidth: 355,
    pageHeight: 595,
    marginTop: 48,
    marginBottom: 48,
    marginLeft: 32,
    marginRight: 32,
    fontSize: 14,
    lineHeight: 1.5,
  },
  ereader: {
    pageWidth: 480,
    pageHeight: 720,
    marginTop: 56,
    marginBottom: 56,
    marginLeft: 40,
    marginRight: 40,
    fontSize: 16,
    lineHeight: 1.7,
  },
};
```

---

### 4.5 Solución: Índice de Contenidos (TOC)

**Estrategia:**  
Crear un componente sidebar que extraiga la estructura de capítulos y permita navegación directa.

**Implementación:**

```tsx
// components/table-of-contents.tsx
interface TOCItem {
  id: string;
  title: string;
  level: number; // 1 para H1, 2 para H2, etc.
  pageNumber: number;
}

interface TableOfContentsProps {
  chapters: ChapterPreview[];
  pages: PreviewPage[];
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
}

export function TableOfContents({
  chapters,
  pages,
  currentPage,
  onNavigate,
}: TableOfContentsProps) {
  // Construir índice desde los capítulos y las páginas
  const tocItems = useMemo(() => {
    const items: TOCItem[] = [];

    // Añadir portada
    items.push({
      id: "cover",
      title: "Portada",
      level: 0,
      pageNumber: 0,
    });

    // Extraer títulos de capítulos y mapear a páginas
    chapters?.forEach((chapter, idx) => {
      const pageIndex = pages.findIndex(
        (p) => p.type === "content" && p.chapterTitle === chapter.title
      );

      items.push({
        id: chapter.id || `chapter-${idx}`,
        title: chapter.title || `Capítulo ${idx + 1}`,
        level: 1,
        pageNumber: pageIndex !== -1 ? pageIndex : idx + 2,
      });
    });

    return items;
  }, [chapters, pages]);

  return (
    <nav className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <List className="h-4 w-4" />
          Índice
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.pageNumber)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-muted",
                currentPage === item.pageNumber &&
                  "bg-primary/10 text-primary font-medium",
                item.level === 0 && "font-semibold",
                item.level > 1 && `pl-${4 + item.level * 2}`
              )}
            >
              <span className="truncate block">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                Pág. {item.pageNumber + 1}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        {tocItems.length} secciones · {pages.length} páginas
      </div>
    </nav>
  );
}
```

---

## 5. Componente Integrado Final

### 5.1 PreviewModal Refactorizado

```tsx
// components/preview-modal-v2.tsx
"use client";

import { useMemo, useState, useCallback } from "react";
import { X, Share, Eye, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { CoverPage } from "@/components/cover-page";
import { TableOfContents } from "@/components/table-of-contents";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { DeviceSelector } from "@/components/device-selector";
import { PageRenderer } from "@/components/page-renderer";

import { buildPreviewPages, PreviewPage } from "@/lib/preview-builder";
import { paginateContent } from "@/lib/content-paginator";
import {
  DEVICE_PAGINATION_CONFIGS,
  FORMAT_PRESETS,
} from "@/lib/device-configs";

// ... (interfaces existentes)

type ViewMode = "single" | "spread";
type PreviewFormat = "laptop" | "tablet" | "mobile" | "ereader";

export default function PreviewModalV2({
  bookData,
  onClose,
}: PreviewModalProps) {
  // Estado del visor
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [format, setFormat] = useState<PreviewFormat>("laptop");
  const [zoom, setZoom] = useState(75);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Generar páginas basado en el formato seleccionado
  const pages = useMemo(() => {
    return buildPreviewPages(bookData, DEVICE_PAGINATION_CONFIGS[format]);
  }, [bookData, format]);

  const totalPages = pages.length;

  // Navegación de páginas
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    const increment = viewMode === "spread" ? 2 : 1;
    goToPage(currentPage + increment);
  }, [currentPage, viewMode, goToPage]);

  const prevPage = useCallback(() => {
    const decrement = viewMode === "spread" ? 2 : 1;
    goToPage(currentPage - decrement);
  }, [currentPage, viewMode, goToPage]);

  // Páginas visibles según modo
  const visiblePages = useMemo(() => {
    if (viewMode === "single") {
      return [pages[currentPage]].filter(Boolean);
    }
    const leftIdx = currentPage % 2 === 0 ? currentPage : currentPage - 1;
    return [pages[leftIdx], pages[leftIdx + 1]].filter(Boolean);
  }, [pages, currentPage, viewMode]);

  // Dimensiones escaladas
  const preset = FORMAT_PRESETS[format];
  const scaledWidth = preset.viewportWidth * (zoom / 100);
  const scaledHeight = preset.pagePixelHeight * (zoom / 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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
          <Badge variant="secondary">
            {bookData.chapters?.length || 0} capítulos
          </Badge>
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
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
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
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10">{zoom}%</span>
        </div>

        {/* Separador */}
        <div className="h-6 border-l border-border" />

        {/* Modo de Vista */}
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

        {/* Separador */}
        <div className="h-6 border-l border-border" />

        {/* Selector de Dispositivo */}
        <DeviceSelector format={format} onFormatChange={setFormat} />

        {/* Exportar */}
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* ═══════════════════════ CONTENIDO PRINCIPAL ═══════════════════════ */}
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

        {/* Área de Preview */}
        <main className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-hidden">
          <div
            className={cn(
              "flex transition-all duration-300",
              viewMode === "spread" ? "gap-1" : "gap-0"
            )}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
            }}
          >
            {visiblePages.map((page, idx) => (
              <PageRenderer
                key={`page-${currentPage}-${idx}`}
                page={page}
                width={preset.viewportWidth}
                height={preset.pagePixelHeight}
                format={format}
                bookData={bookData}
              />
            ))}
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
            className="w-12 text-center border rounded px-2 py-1"
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
```

---

## 6. Archivos a Crear/Modificar

| Archivo                            | Acción   | Descripción                       |
| ---------------------------------- | -------- | --------------------------------- |
| `components/preview-modal-v2.tsx`  | Crear    | Nuevo modal refactorizado         |
| `components/cover-page.tsx`        | Crear    | Renderizado de portada            |
| `components/table-of-contents.tsx` | Crear    | Panel de índice                   |
| `components/view-mode-toggle.tsx`  | Crear    | Toggle 1/2 páginas                |
| `components/device-selector.tsx`   | Crear    | Selector de dispositivos          |
| `components/page-renderer.tsx`     | Crear    | Renderizador de página individual |
| `lib/content-paginator.ts`         | Crear    | Lógica de paginación              |
| `lib/preview-builder.ts`           | Crear    | Constructor de páginas            |
| `lib/device-configs.ts`            | Crear    | Configuraciones por dispositivo   |
| `components/paged-preview.tsx`     | Deprecar | Marcar para eliminación           |
| `components/preview-modal.tsx`     | Deprecar | Reemplazar por v2                 |

---

## 7. Plan de Implementación

### Fase 1: Infraestructura (1-2 días)

1. Crear tipos y configuraciones (`lib/device-configs.ts`, tipos)
2. Implementar `lib/content-paginator.ts`
3. Implementar `lib/preview-builder.ts`

### Fase 2: Componentes UI (2-3 días)

1. Crear `CoverPage`
2. Crear `TableOfContents`
3. Crear `ViewModeToggle` y `DeviceSelector`
4. Crear `PageRenderer`

### Fase 3: Integración (1-2 días)

1. Crear `PreviewModalV2` integrando todos los componentes
2. Probar con diferentes contenidos y dispositivos
3. Ajustar estilos y animaciones

### Fase 4: Migración (1 día)

1. Actualizar importaciones en `anclora-press.tsx`
2. Deprecar componentes antiguos
3. Documentar cambios

---

## 8. Consideraciones Adicionales

### Performance

- Implementar virtualización para libros con muchas páginas
- Usar `useMemo` para cálculos costosos de paginación
- Lazy load de páginas no visibles

### Accesibilidad

- Añadir `aria-labels` a controles de navegación
- Soporte para navegación con teclado (flechas, Page Up/Down)
- Anunciar cambios de página a lectores de pantalla

### Responsive

- Ocultar sidebar automáticamente en pantallas pequeñas
- Ajustar zoom inicial según viewport
- Considerar modo fullscreen para móviles

---

## 9. Conclusiones

La refactorización propuesta aborda los cinco problemas críticos identificados mediante una reestructuración completa del sistema de vista previa. La nueva arquitectura:

1. **Elimina scrolls múltiples** mediante un layout con altura fija y paginación real
2. **Muestra la portada correctamente** con un componente dedicado
3. **Ofrece modos 1/2 páginas** con navegación intuitiva
4. **Adapta contenido al dispositivo** mediante paginación dinámica
5. **Incluye índice navegable** para acceso rápido a capítulos

La implementación requiere aproximadamente 5-8 días de desarrollo y produce un visor profesional comparable a aplicaciones de lectura de ebooks.
