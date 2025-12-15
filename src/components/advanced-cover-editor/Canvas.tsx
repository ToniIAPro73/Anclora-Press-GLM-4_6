'use client';

import { useEffect, useRef } from 'react';
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
  onCanvasReady?: (canvas: any) => void;
}

export default function Canvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas } = useCanvasStore();
  const guidesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;

    const initCanvas = async () => {
      try {
        // Crear canvas con Fabric.js
        const fabricCanvas = await createFabricCanvas(canvasRef.current!);
        
        if (!isMounted) return;

        // Configurar guías de alineación
        await setupAlignmentGuides(fabricCanvas);

        // Dibujar guías cuando se selecciona un objeto
        fabricCanvas.on('object:selected', async (e: any) => {
          clearAlignmentGuides(fabricCanvas);
          if (e.selected && e.selected[0]) {
            guidesRef.current = await drawAlignmentGuides(fabricCanvas, e.selected[0]);
          }
        });

        // Limpiar guías cuando se deselecciona
        fabricCanvas.on('selection:cleared', () => {
          clearAlignmentGuides(fabricCanvas);
        });

        // Actualizar guías mientras se mueve
        fabricCanvas.on('object:moving', async () => {
          clearAlignmentGuides(fabricCanvas);
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject) {
            guidesRef.current = await drawAlignmentGuides(fabricCanvas, activeObject);
          }
        });

        // Guardar canvas en el store
        setCanvas(fabricCanvas);
        onCanvasReady?.(fabricCanvas);
      } catch (error) {
        console.error('Error initializing canvas:', error);
      }
    };

    initCanvas();

    // Cleanup
    return () => {
      isMounted = false;
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
