'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave?: () => void;
  saveButtonText?: string;
}

export default function FullscreenModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSave,
  saveButtonText = 'Guardar Cambios',
}: FullscreenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700 bg-slate-900 flex-shrink-0">
        <Button onClick={onClose} variant="outline">
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        {onSave && (
          <Button onClick={onSave} variant="default">
            {saveButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
