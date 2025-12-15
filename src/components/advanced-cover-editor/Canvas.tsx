'use client';

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import {
  createFabricCanvas,
  setupAlignmentGuides,
  drawAlignmentGuides,
  clearAlignmentGuides,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/lib/canvas-utils';
import { useCanvasStore } from '@/lib/canvas-store';

interface CanvasProps {
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export default function Canvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas } = useCanvasStore();
  const guidesRef = useRef<fabric.Line[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Crear canvas con Fabric.js
    const fabricCanvas = createFabricCanvas(canvasRef.current);
    
    // Configurar guías de alineación
    setupAlignmentGuides(fabricCanvas);

    // Dibujar guías cuando se selecciona un objeto
    fabricCanvas.on('object:selected', (e) => {
      clearAlignmentGuides(fabricCanvas);
      if (e.selected && e.selected[0]) {
        guidesRef.current = drawAlignmentGuides(fabricCanvas, e.selected[0]);
      }
    });

    // Limpiar guías cuando se deselecciona
    fabricCanvas.on('selection:cleared', () => {
      clearAlignmentGuides(fabricCanvas);
    });

    // Actualizar guías mientras se mueve
    fabricCanvas.on('object:moving', () => {
      clearAlignmentGuides(fabricCanvas);
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        guidesRef.current = drawAlignmentGuides(fabricCanvas, activeObject);
      }
    });

    // Guardar canvas en el store
    setCanvas(fabricCanvas);
    onCanvasReady?.(fabricCanvas);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
    };
  }, [setCanvas, onCanvasReady]);

  return (
    <div className="flex justify-center items-center bg-gray-100 p-4 rounded-lg">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-300 shadow-lg cursor-crosshair"
      />
    </div>
  );
}
