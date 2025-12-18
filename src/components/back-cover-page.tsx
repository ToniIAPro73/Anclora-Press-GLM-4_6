"use client";

/**
 * Back Cover Page Component
 * Renders the book back cover with information and reviews
 */

import { PreviewFormat, FORMAT_PRESETS } from "@/lib/device-configs";
import { BackCoverData } from "@/lib/preview-builder";
import { cn } from "@/lib/utils";

interface BackCoverPageProps {
  backCoverData: BackCoverData;
  backCoverImage?: string | null;
  coverColor: string;
  format: PreviewFormat;
  className?: string;
}

// Layout configurations for back cover
const backCoverLayoutConfigs: Record<
  string,
  {
    container: string;
    topSection: string;
    bottomSection: string;
  }
> = {
  centered: {
    container: "justify-center items-center",
    topSection: "space-y-4 text-center",
    bottomSection: "space-y-3 text-center mt-6",
  },
  top: {
    container: "justify-start items-start",
    topSection: "space-y-4 text-left pt-0",
    bottomSection: "space-y-3 text-left mt-auto",
  },
  bottom: {
    container: "justify-end items-end",
    topSection: "space-y-4 text-right mt-auto",
    bottomSection: "space-y-3 text-right pb-0",
  },
  split: {
    container: "justify-between items-stretch",
    topSection: "space-y-4 text-left",
    bottomSection: "space-y-3 text-left",
  },
};

export function BackCoverPage({
  backCoverData,
  backCoverImage,
  coverColor,
  format,
  className,
}: BackCoverPageProps) {
  const dimensions = FORMAT_PRESETS[format];
  const layout = backCoverData.selectedLayout || "centered";
  const layoutConfig = backCoverLayoutConfigs[layout] || backCoverLayoutConfigs.centered;

  return (
    <div
      className={cn(
        "relative flex flex-col shadow-2xl overflow-hidden",
        className
      )}
      style={{
        width: `${dimensions.viewportWidth}px`,
        height: `${dimensions.pagePixelHeight}px`,
      }}
    >
      {/* Background with color and optional image overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: coverColor }}
      >
        {backCoverImage && (
          <img
            src={backCoverImage}
            alt="Back cover background"
            className="w-full h-full object-cover opacity-60"
          />
        )}
      </div>

      {/* Back cover content */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col p-8 text-white transition-all",
          layoutConfig.container
        )}
      >
        {/* Top Section */}
        <div className={layoutConfig.topSection}>
          <h1
            className={cn(
              "font-bold leading-tight",
              format === "mobile" && "text-xl",
              format === "ereader" && "text-2xl",
              format === "tablet" && "text-3xl",
              format === "laptop" && "text-4xl"
            )}
          >
            {backCoverData.title || "Título"}
          </h1>

          <p
            className={cn(
              "opacity-90",
              format === "mobile" && "text-xs",
              format === "ereader" && "text-sm",
              format === "tablet" && "text-base",
              format === "laptop" && "text-lg"
            )}
          >
            {backCoverData.author}
          </p>

          {backCoverData.description && (
            <p
              className={cn(
                "leading-relaxed opacity-80",
                format === "mobile" && "text-xs line-clamp-6",
                format === "ereader" && "text-sm line-clamp-6",
                format === "tablet" && "text-base line-clamp-5",
                format === "laptop" && "text-base line-clamp-4"
              )}
            >
              {backCoverData.description}
            </p>
          )}
        </div>

        {/* Bottom Section */}
        <div className={layoutConfig.bottomSection}>
          {backCoverData.publisher && (
            <div>
              <p
                className={cn(
                  "font-medium",
                  format === "mobile" && "text-xs",
                  format === "ereader" && "text-xs",
                  format === "tablet" && "text-sm",
                  format === "laptop" && "text-sm"
                )}
              >
                Editorial
              </p>
              <p
                className={cn(
                  "opacity-90",
                  format === "mobile" && "text-xs",
                  format === "ereader" && "text-sm",
                  format === "tablet" && "text-base",
                  format === "laptop" && "text-base"
                )}
              >
                {backCoverData.publisher}
              </p>
            </div>
          )}

          {backCoverData.isbn && (
            <div>
              <p
                className={cn(
                  "font-medium",
                  format === "mobile" && "text-xs",
                  format === "ereader" && "text-xs",
                  format === "tablet" && "text-sm",
                  format === "laptop" && "text-sm"
                )}
              >
                ISBN
              </p>
              <p
                className={cn(
                  "opacity-90",
                  format === "mobile" && "text-xs",
                  format === "ereader" && "text-sm",
                  format === "tablet" && "text-base",
                  format === "laptop" && "text-base"
                )}
              >
                {backCoverData.isbn}
              </p>
            </div>
          )}

          {backCoverData.reviews && backCoverData.reviews.length > 0 && (
            <div>
              <p
                className={cn(
                  "font-medium mb-2",
                  format === "mobile" && "text-xs",
                  format === "ereader" && "text-xs",
                  format === "tablet" && "text-sm",
                  format === "laptop" && "text-sm"
                )}
              >
                Reseñas
              </p>
              <div className="space-y-2">
                {backCoverData.reviews.slice(0, 2).map((review, index) => (
                  <div
                    key={review.id || index}
                    className={cn(
                      format === "mobile" && "text-xs",
                      format === "ereader" && "text-xs",
                      format === "tablet" && "text-sm",
                      format === "laptop" && "text-sm"
                    )}
                  >
                    <p className="font-medium opacity-90">{review.author}</p>
                    <p className="opacity-80 line-clamp-2">"{review.text}"</p>
                    {review.source && (
                      <p className="opacity-70">— {review.source}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
