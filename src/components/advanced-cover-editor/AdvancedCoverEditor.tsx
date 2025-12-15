'use client';

import { useState } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/lib/canvas-store';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertyPanel from './PropertyPanel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wand2, X } from 'lucide-react';

interface AdvancedCoverEditorProps {
  onSave?: (imageData: string) => void;
  onClose?: () => void;
  initialImage?: string;
}

export default function AdvancedCoverEditor({
  onSave,
  onClose,
  initialImage,
}: AdvancedCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canvas, clear } = useCanvasStore();

  const handleCanvasReady = (fabricCanvas: fabric.Canvas) => {
    // Cargar imagen inicial si existe
    if (initialImage) {
      fabric.Image.fromURL(
        initialImage,
        (img) => {
          img.scaleToWidth(fabricCanvas.width!);
          fabricCanvas.add(img);
          fabricCanvas.sendToBack(img);
          fabricCanvas.renderAll();
        },
        { crossOrigin: 'anonymous' },
        { crossOrigin: 'anonymous' }
      );
    }
  };

  const handleSave = () => {
    if (!canvas) return;
    const imageData = canvas.toDataURL({
      format: 'png',
      quality: 0.95,
      multiplier: 2,
    });
    onSave?.(imageData);
    setIsOpen(false);
  };

  const handleClose = () => {
    clear();
    setIsOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wand2 className="w-4 h-4 mr-2" />
          Edición Avanzada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor Avanzado de Portada</DialogTitle>
          <DialogDescription>
            Diseña tu portada con herramientas avanzadas similares a Canva Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <Toolbar />

          {/* Main Editor Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Canvas */}
            <div className="lg:col-span-3">
              <Canvas onCanvasReady={handleCanvasReady} />
            </div>

            {/* Property Panel */}
            <div className="lg:col-span-1">
              <PropertyPanel />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="default">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
