'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createFabricCanvas,
  setupAlignmentGuides,
  drawAlignmentGuides,
  clearAlignmentGuides,
  disposeCanvas,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/lib/canvas-utils';
import { useCanvasStore } from '@/lib/canvas-store';

interface CanvasProps {
  onCanvasReady?: (canvas: any) => void;
}

export default function Canvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const { setCanvas, canvas } = useCanvasStore();
  const guidesRef = useRef<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    let isMounted = true;

    const initCanvas = async () => {
      try {
        // Si ya existe un canvas, limpiarlo primero
        if (fabricCanvasRef.current) {
          disposeCanvas(fabricCanvasRef.current);
          fabricCanvasRef.current = null;
        }

        // Crear canvas con Fabric.js
        const fabricCanvas = await createFabricCanvas(canvasRef.current!);
        
        if (!isMounted) {
          disposeCanvas(fabricCanvas);
          return;
        }

        fabricCanvasRef.current = fabricCanvas;

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
        setIsInitialized(true);
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
  }, [isInitialized, setCanvas, onCanvasReady]);

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (fabricCanvasRef.current) {
        disposeCanvas(fabricCanvasRef.current);
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center bg-slate-900 rounded-lg overflow-hidden w-full h-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-slate-600 shadow-2xl cursor-crosshair"
      />
    </div>
  );
}
