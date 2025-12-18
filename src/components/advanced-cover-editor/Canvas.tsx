"use client";

/**
 * Canvas.tsx - VERSION CORREGIDA
 *
 * CAMBIOS:
 * 1. Eventos de selección corregidos para Fabric.js v5+
 * 2. Búsqueda de elementos por ID en lugar de referencia
 * 3. Mejor manejo de selección
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createFabricCanvas,
  setupAlignmentGuides,
  drawAlignmentGuides,
  clearAlignmentGuides,
  disposeCanvas,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@/lib/canvas-utils";
import { useCanvasStore } from "@/lib/canvas-store";

interface CanvasProps {
  onCanvasReady?: (canvas: any) => void;
}

export default function Canvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const { setCanvas, selectElement } = useCanvasStore();
  const guidesRef = useRef<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const memoizedOnCanvasReady = useCallback(onCanvasReady || (() => {}), [
    onCanvasReady,
  ]);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    let isMounted = true;

    const initCanvas = async () => {
      try {
        if (fabricCanvasRef.current) {
          disposeCanvas(fabricCanvasRef.current);
          fabricCanvasRef.current = null;
        }

        const fabricCanvas = await createFabricCanvas(canvasRef.current!);

        if (!isMounted) {
          disposeCanvas(fabricCanvas);
          return;
        }

        fabricCanvasRef.current = fabricCanvas;

        await setupAlignmentGuides(fabricCanvas);

        // ═══════════════════════════════════════════════════════════════════
        // EVENTOS DE SELECCIÓN CORREGIDOS
        // ═══════════════════════════════════════════════════════════════════

        // Evento cuando se selecciona un objeto
        fabricCanvas.on("selection:created", (e: any) => {
          handleSelection(e, fabricCanvas);
        });

        // Evento cuando cambia la selección
        fabricCanvas.on("selection:updated", (e: any) => {
          handleSelection(e, fabricCanvas);
        });

        // Evento cuando se deselecciona
        fabricCanvas.on("selection:cleared", () => {
          clearAlignmentGuides(fabricCanvas);
          selectElement(null);
        });

        // Actualizar guías mientras se mueve
        fabricCanvas.on("object:moving", async () => {
          clearAlignmentGuides(fabricCanvas);
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject) {
            guidesRef.current = await drawAlignmentGuides(
              fabricCanvas,
              activeObject
            );
          }
        });

        setCanvas(fabricCanvas);
        setIsInitialized(true);

        if (memoizedOnCanvasReady) {
          memoizedOnCanvasReady(fabricCanvas);
        }
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    };

    // Función para manejar la selección
    const handleSelection = async (e: any, fabricCanvas: any) => {
      clearAlignmentGuides(fabricCanvas);

      const selectedObj = e.selected?.[0];
      if (!selectedObj) return;

      // Buscar el elemento en el store por ID
      const elements = useCanvasStore.getState().elements;
      const element = elements.find((el) => el.id === selectedObj.id);

      if (element) {
        selectElement(element);
        console.log("Element selected:", element.id);
      } else {
        // Si no tiene ID en el store, crear un elemento temporal
        console.log("Selected object not in store, id:", selectedObj.id);
      }

      guidesRef.current = await drawAlignmentGuides(fabricCanvas, selectedObj);
    };

    initCanvas();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, setCanvas, memoizedOnCanvasReady, selectElement]);

  useEffect(() => {
    return () => {
      if (fabricCanvasRef.current) {
        disposeCanvas(fabricCanvasRef.current);
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center bg-slate-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-slate-600 shadow-2xl cursor-crosshair"
      />
    </div>
  );
}
