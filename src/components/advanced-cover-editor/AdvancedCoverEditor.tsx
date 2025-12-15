'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/lib/canvas-store';
import { exportCanvasToImage, getFabric } from '@/lib/canvas-utils';
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
  title?: string;
  author?: string;
  coverColor?: string;
}

export default function AdvancedCoverEditor({
  onSave,
  onClose,
  initialImage,
  title = '',
  author = '',
  coverColor = '#ffffff',
}: AdvancedCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canvas, clear } = useCanvasStore();

  const handleCanvasReady = async (fabricCanvas: any) => {
    const fabric = await getFabric();

    // 1. Establecer fondo de color usando la sintaxis correcta de Fabric.js v6
    fabricCanvas.set({ backgroundColor: coverColor });

    // 2. Cargar imagen de fondo si existe
    if (initialImage) {
      try {
        const img = await new Promise<any>((resolve, reject) => {
          fabric.Image.fromURL(
            initialImage,
            (img: any) => resolve(img),
            { crossOrigin: 'anonymous' },
            { crossOrigin: 'anonymous' }
          );
        });

        img.scaleToWidth(fabricCanvas.width);
        img.set({ opacity: 0.8 });
        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
      } catch (error) {
        console.warn('Error loading background image:', error);
      }
    }

    // 3. Agregar título si existe
    if (title) {
      const titleText = new fabric.IText(title, {
        left: fabricCanvas.width / 2,
        top: fabricCanvas.height / 3,
        fontSize: 48,
        fontFamily: 'Playfair Display',
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
      });
      fabricCanvas.add(titleText);
    }

    // 4. Agregar autor si existe
    if (author) {
      const authorText = new fabric.IText(author, {
        left: fabricCanvas.width / 2,
        top: (fabricCanvas.height * 2) / 3,
        fontSize: 24,
        fontFamily: 'Inter',
        fill: '#ffffff',
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
      });
      fabricCanvas.add(authorText);
    }

    fabricCanvas.renderAll();
  };

  const handleSave = () => {
    if (!canvas) return;
    const imageData = exportCanvasToImage(canvas, 'png');
    onSave?.(imageData);
    // Limpiar el canvas después de guardar
    if (canvas) {
      canvas.dispose?.();
    }
    clear();
    setIsOpen(false);
  };

  const handleClose = () => {
    // Limpiar el canvas antes de cerrar
    if (canvas) {
      canvas.dispose?.();
    }
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
      <DialogContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <DialogTitle className="text-xl text-white">Editor Avanzado de Portada</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">
              Diseña tu portada con herramientas avanzadas similares a Canva Pro
            </DialogDescription>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
            <Toolbar />
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden flex gap-4 p-6 bg-slate-950">
            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center">
              <Canvas onCanvasReady={handleCanvasReady} />
            </div>

            {/* Property Panel */}
            <div className="w-80 overflow-y-auto bg-slate-800 rounded-lg p-4">
              <PropertyPanel />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700 bg-slate-900">
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
