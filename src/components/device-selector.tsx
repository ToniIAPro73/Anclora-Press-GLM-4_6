"use client";

/**
 * Device Selector Component
 * Allows selection of preview format (laptop, tablet, mobile, ereader)
 */

import { Monitor, Tablet, Smartphone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PreviewFormat, FORMAT_PRESETS } from '@/lib/device-configs';
import { cn } from '@/lib/utils';

interface DeviceSelectorProps {
  format: PreviewFormat;
  onFormatChange: (format: PreviewFormat) => void;
  className?: string;
}

const DEVICE_ICONS: Record<PreviewFormat, React.ReactNode> = {
  laptop: <Monitor className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  ereader: <BookOpen className="h-4 w-4" />,
};

export function DeviceSelector({ format, onFormatChange, className }: DeviceSelectorProps) {
  const currentPreset = FORMAT_PRESETS[format];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          {DEVICE_ICONS[format]}
          <span className="text-xs">{currentPreset.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {(Object.keys(FORMAT_PRESETS) as PreviewFormat[]).map((formatKey) => {
          const preset = FORMAT_PRESETS[formatKey];
          const isActive = formatKey === format;

          return (
            <DropdownMenuItem
              key={formatKey}
              onClick={() => onFormatChange(formatKey)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isActive && "bg-primary/10 text-primary font-medium"
              )}
            >
              <span className={cn(isActive && "text-primary")}>
                {DEVICE_ICONS[formatKey]}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{preset.label}</div>
                <div className="text-xs text-muted-foreground">
                  {preset.viewportWidth} × {preset.pagePixelHeight}px
                </div>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
