"use client";

/**
 * Canvas.tsx - VERSION CORREGIDA
 *
 * Eventos de selección funcionando para que PropertyPanel
 * muestre las propiedades del elemento seleccionado
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createFabricCanvas,
  setupAlignmentGuides,
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
        // EVENTOS DE SELECCIÓN
        // ═══════════════════════════════════════════════════════════════════

        // Cuando se crea una selección
        fabricCanvas.on("selection:created", (e: any) => {
          handleObjectSelected(e.selected?.[0]);
        });

        // Cuando cambia la selección
        fabricCanvas.on("selection:updated", (e: any) => {
          handleObjectSelected(e.selected?.[0]);
        });

        // Cuando se limpia la selección
        fabricCanvas.on("selection:cleared", () => {
          selectElement(null);
          console.log("Selection cleared");
        });

        // Función para manejar la selección
        const handleObjectSelected = (selectedObj: any) => {
          if (!selectedObj) return;

          console.log("Object selected:", selectedObj.id, selectedObj.type);

          // Buscar en el store por ID
          const elements = useCanvasStore.getState().elements;
          const element = elements.find((el) => el.id === selectedObj.id);

          if (element) {
            selectElement(element);
            console.log("Element found in store:", element.id);
          } else {
            // Si no está en el store, crear elemento temporal para mostrar propiedades
            const tempElement = {
              id: selectedObj.id || `temp-${Date.now()}`,
              type:
                selectedObj.type === "image"
                  ? ("image" as const)
                  : ("text" as const),
              object: selectedObj,
              properties: {
                fill: selectedObj.fill || "#ffffff",
                fontSize: selectedObj.fontSize,
                fontFamily: selectedObj.fontFamily,
                opacity: selectedObj.opacity || 1,
              },
            };
            selectElement(tempElement);
            console.log("Created temp element for selection");
          }
        };

        setCanvas(fabricCanvas);
        setIsInitialized(true);

        if (memoizedOnCanvasReady) {
          memoizedOnCanvasReady(fabricCanvas);
        }
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    };

    initCanvas();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, setCanvas, memoizedOnCanvasReady, selectElement]);

  // Cleanup
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
        className="border-2 border-slate-600 shadow-2xl"
        style={{ cursor: "default" }}
      />
    </div>
  );
}
