'use client';

import { useRef } from 'react';
import { useCanvasStore } from '@/lib/canvas-store';
import { addTextToCanvas, addImageToCanvas, exportCanvasToImage, getFabric } from '@/lib/canvas-utils';
import { Button } from '@/components/ui/button';
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

  const handleAddText = async () => {
    if (!canvas) return;
    const fabricText = await addTextToCanvas(canvas, 'Nuevo Texto');
    canvas.setActiveObject(fabricText);
    canvas.renderAll(); // Asegurar que se renderice
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
  };;

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
        canvas.setActiveObject(fabricImage);
        canvas.renderAll(); // Asegurar que se renderice
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
    const dataUrl = exportCanvasToImage(canvas, 'png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'portada.png';
    link.click();
  };

  const handleDuplicate = async () => {
    if (!canvas) return;
    const fabric = await getFabric();
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
    <div className="flex flex-wrap gap-2 bg-slate-800">
      {/* Agregar Texto */}
      <Button
        onClick={handleAddText}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
        title="Agregar texto"
      >
        <Type className="w-4 h-4 mr-2" />
        Texto
      </Button>

      {/* Agregar Imagen */}
      <Button
        onClick={handleAddImage}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
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

      {/* Separador */}
      <div className="border-l border-slate-600" />

      {/* Deshacer */}
      <Button
        onClick={undo}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
        title="Deshacer"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      {/* Rehacer */}
      <Button
        onClick={redo}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
        title="Rehacer"
      >
        <RotateCw className="w-4 h-4" />
      </Button>

      {/* Separador */}
      <div className="border-l border-slate-600" />

      {/* Duplicar */}
      <Button
        onClick={handleDuplicate}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
        title="Duplicar elemento"
      >
        <Copy className="w-4 h-4 mr-2" />
        Duplicar
      </Button>

      {/* Limpiar Canvas */}
      <Button
        onClick={handleClear}
        variant="outline"
        size="sm"
        className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white"
        title="Limpiar canvas"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Limpiar
      </Button>

      {/* Separador */}
      <div className="border-l border-slate-600" />

      {/* Exportar */}
      <Button
        onClick={handleExport}
        variant="default"
        size="sm"
        className="bg-lime-500 text-slate-900 hover:bg-lime-400 ml-auto"
        title="Exportar como imagen"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>
  );
}
