"use client";

/**
 * View Mode Toggle Component
 * Toggles between single page and spread (2 pages) view
 */

import { FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'single' | 'spread';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({ viewMode, onViewModeChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 bg-muted rounded-lg p-1", className)}>
      <Button
        variant={viewMode === 'single' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('single')}
        className={cn(
          "gap-2 transition-all",
          viewMode === 'single' && "shadow-sm"
        )}
        title="Vista de 1 página"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs font-medium">1 Página</span>
      </Button>
      <Button
        variant={viewMode === 'spread' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('spread')}
        className={cn(
          "gap-2 transition-all",
          viewMode === 'spread' && "shadow-sm"
        )}
        title="Vista de 2 páginas"
      >
        <BookOpen className="h-4 w-4" />
        <span className="text-xs font-medium">2 Páginas</span>
      </Button>
    </div>
  );
}
