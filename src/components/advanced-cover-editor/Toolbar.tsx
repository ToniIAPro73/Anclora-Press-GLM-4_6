'use client';

import { useRef } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/lib/canvas-store';
import { addTextToCanvas, addImageToCanvas } from '@/lib/canvas-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Type,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Download,
  Copy,
  Trash2,
} from 'lucide-react';

export default function Toolbar() {
  const { canvas, addElement, undo, redo } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    if (!canvas) return;

    const fabricText = addTextToCanvas(canvas, 'Nuevo Texto');
    addElement({
      id: `text-${Date.now()}`,
      type: 'text',
      object: fabricText,
      properties: {
        fill: '#000000',
        fontSize: 24,
        fontFamily: 'Arial',
        opacity: 1,
      },
    });
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      try {
        const fabricImage = await addImageToCanvas(canvas, imageUrl);
        addElement({
          id: `image-${Date.now()}`,
          type: 'image',
          object: fabricImage,
          properties: {
            opacity: 1,
          },
        });
      } catch (error) {
        console.error('Error adding image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 0.95,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'portada.png';
    link.click();
  };

  const handleDuplicate = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const cloned = fabric.util.object.clone(activeObject);
    cloned.set({
      left: (cloned.left || 0) + 10,
      top: (cloned.top || 0) + 10,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  };

  const handleClear = () => {
    if (!canvas) return;
    if (confirm('¿Estás seguro de que deseas limpiar el canvas?')) {
      canvas.clear();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-100 rounded-lg">
      <Button
        onClick={handleAddText}
        variant="outline"
        size="sm"
        title="Agregar texto"
      >
        <Type className="w-4 h-4 mr-2" />
        Texto
      </Button>

      <Button
        onClick={handleAddImage}
        variant="outline"
        size="sm"
        title="Agregar imagen"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Imagen
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="border-l border-gray-300" />

      <Button
        onClick={undo}
        variant="outline"
        size="sm"
        title="Deshacer"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Button
        onClick={redo}
        variant="outline"
        size="sm"
        title="Rehacer"
      >
        <RotateCw className="w-4 h-4" />
      </Button>

      <div className="border-l border-gray-300" />

      <Button
        onClick={handleDuplicate}
        variant="outline"
        size="sm"
        title="Duplicar elemento"
      >
        <Copy className="w-4 h-4 mr-2" />
        Duplicar
      </Button>

      <Button
        onClick={handleClear}
        variant="outline"
        size="sm"
        title="Limpiar canvas"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Limpiar
      </Button>

      <div className="border-l border-gray-300" />

      <Button
        onClick={handleExport}
        variant="default"
        size="sm"
        title="Exportar como imagen"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>
  );
}
