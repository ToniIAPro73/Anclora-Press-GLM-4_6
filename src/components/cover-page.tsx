"use client";

/**
 * Cover Page Component
 * Renders the book cover with image or color background
 */

import { PreviewFormat, FORMAT_PRESETS } from '@/lib/device-configs';
import { CoverData } from '@/lib/preview-builder';
import { cn } from '@/lib/utils';

interface CoverPageProps {
  coverData: CoverData;
  format: PreviewFormat;
  className?: string;
}

export function CoverPage({ coverData, format, className }: CoverPageProps) {
  const dimensions = FORMAT_PRESETS[format];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center bg-cover bg-center shadow-2xl overflow-hidden",
        className
      )}
      style={{
        width: `${dimensions.viewportWidth}px`,
        height: `${dimensions.pagePixelHeight}px`,
        backgroundColor: coverData.coverImage ? 'transparent' : coverData.coverColor,
      }}
    >
      {/* Background image if provided */}
      {coverData.coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${coverData.coverImage})`,
          }}
        >
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>
      )}

      {/* Cover content */}
      <div className="relative z-10 px-8 py-12 space-y-6 max-w-full">
        {/* Title */}
        <h1
          className={cn(
            "font-serif font-bold text-white drop-shadow-lg leading-tight",
            format === 'mobile' && "text-2xl",
            format === 'ereader' && "text-3xl",
            format === 'tablet' && "text-4xl",
            format === 'laptop' && "text-5xl"
          )}
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {coverData.title}
        </h1>

        {/* Subtitle */}
        {coverData.subtitle && (
          <p
            className={cn(
              "italic text-white/90 drop-shadow-md",
              format === 'mobile' && "text-sm",
              format === 'ereader' && "text-base",
              format === 'tablet' && "text-lg",
              format === 'laptop' && "text-xl"
            )}
            style={{
              textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            {coverData.subtitle}
          </p>
        )}

        {/* Author */}
        <p
          className={cn(
            "text-white/80 font-medium mt-auto",
            format === 'mobile' && "text-xs",
            format === 'ereader' && "text-sm",
            format === 'tablet' && "text-base",
            format === 'laptop' && "text-lg"
          )}
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {coverData.author}
        </p>
      </div>

      {/* Decorative bottom bar */}
      {!coverData.coverImage && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />
      )}
    </div>
  );
}
