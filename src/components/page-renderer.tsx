"use client";

/**
 * Page Renderer Component
 * Renders individual pages (cover, title, or content) for preview
 */

import { PreviewFormat, FORMAT_PRESETS, DEVICE_PAGINATION_CONFIGS } from '@/lib/device-configs';
import { PreviewPage, BookData } from '@/lib/preview-builder';
import { CoverPage } from './cover-page';
import { cn } from '@/lib/utils';

interface PageRendererProps {
  page: PreviewPage;
  format: PreviewFormat;
  bookData?: BookData;
  className?: string;
}

export function PageRenderer({ page, format, bookData, className }: PageRendererProps) {
  const preset = FORMAT_PRESETS[format];
  const config = DEVICE_PAGINATION_CONFIGS[format];

  // Render cover page
  if (page.type === 'cover' && page.coverData) {
    return (
      <CoverPage
        coverData={page.coverData}
        format={format}
        className={className}
      />
    );
  }

  // Render title page
  if (page.type === 'title') {
    return (
      <div
        className={cn(
          "bg-background border border-border shadow-xl flex items-center justify-center",
          className
        )}
        style={{
          width: `${preset.viewportWidth}px`,
          height: `${preset.pagePixelHeight}px`,
          padding: `${config.marginTop}px ${config.marginRight}px ${config.marginBottom}px ${config.marginLeft}px`,
        }}
      >
        <div
          className="prose prose-sm max-w-none text-center"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>
    );
  }

  // Render content page
  return (
    <div
      className={cn(
        "bg-background border border-border shadow-xl overflow-hidden",
        className
      )}
      style={{
        width: `${preset.viewportWidth}px`,
        height: `${preset.pagePixelHeight}px`,
      }}
    >
      <div
        className="h-full overflow-hidden"
        style={{
          padding: `${config.marginTop}px ${config.marginRight}px ${config.marginBottom}px ${config.marginLeft}px`,
          fontSize: `${config.fontSize}px`,
          lineHeight: config.lineHeight,
        }}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none h-full",
            // Responsive prose sizing
            format === 'mobile' && "prose-xs",
            format === 'ereader' && "prose-sm",
            format === 'tablet' && "prose-base",
            format === 'laptop' && "prose-base"
          )}
          style={{
            fontSize: `${config.fontSize}px`,
            lineHeight: config.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>

      {/* Page number footer */}
      {page.pageNumber !== undefined && (
        <div
          className="absolute bottom-4 right-0 left-0 text-center text-xs text-muted-foreground"
          style={{
            fontSize: `${config.fontSize * 0.75}px`,
          }}
        >
          {page.pageNumber}
        </div>
      )}
    </div>
  );
}
