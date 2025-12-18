"use client";

/**
 * Advanced Cover Editor - VERSION 4
 *
 * CAMBIOS v4:
 * - Timeout aumentado a 15 segundos para imágenes base64 grandes
 * - Mejor manejo de errores en carga de imagen
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useCanvasStore } from "@/lib/canvas-store";
import { getFabric } from "@/lib/canvas-utils";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import PropertyPanel from "./PropertyPanel";
import FullscreenModal from "./FullscreenModal";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface AdvancedCoverEditorProps {
  onSave?: (imageData: string) => void;
  onClose?: () => void;
  initialImage?: string;
  title?: string;
  subtitle?: string;
  author?: string;
  coverColor?: string;
  coverLayout?: string;
  coverFont?: string;
}

export default function AdvancedCoverEditor({
  onSave,
  onClose,
  initialImage,
  title = "",
  subtitle = "",
  author = "",
  coverColor = "#0088a0",
  coverLayout = "centered",
  coverFont = "font-serif",
}: AdvancedCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const { canvas, clear } = useCanvasStore();

  // Refs para los datos actuales (evita problemas de closure)
  const dataRef = useRef({
    initialImage,
    title,
    subtitle,
    author,
    coverColor,
    coverLayout,
    coverFont,
  });

  // Actualizar refs cuando cambien los props
  useEffect(() => {
    dataRef.current = {
      initialImage,
      title,
      subtitle,
      author,
      coverColor,
      coverLayout,
      coverFont,
    };
  }, [
    initialImage,
    title,
    subtitle,
    author,
    coverColor,
    coverLayout,
    coverFont,
  ]);

  const getFontFamily = (fontClass: string): string => {
    const fontMap: Record<string, string> = {
      "font-serif": "Georgia, serif",
      "font-playfair": "Playfair Display, Georgia, serif",
      "font-merriweather": "Merriweather, Georgia, serif",
      "font-lora": "Lora, Georgia, serif",
      "font-sans": "Inter, system-ui, sans-serif",
      "font-montserrat": "Montserrat, system-ui, sans-serif",
    };
    return fontMap[fontClass] || "Georgia, serif";
  };

  const getLayoutPositions = (canvasHeight: number, layout: string) => {
    switch (layout) {
      case "top":
        return {
          titleY: canvasHeight * 0.15,
          subtitleY: canvasHeight * 0.25,
          authorY: canvasHeight * 0.85,
        };
      case "bottom":
        return {
          titleY: canvasHeight * 0.65,
          subtitleY: canvasHeight * 0.75,
          authorY: canvasHeight * 0.88,
        };
      case "split":
        return {
          titleY: canvasHeight * 0.12,
          subtitleY: canvasHeight * 0.2,
          authorY: canvasHeight * 0.9,
        };
      default: // centered
        return {
          titleY: canvasHeight * 0.55,
          subtitleY: canvasHeight * 0.65,
          authorY: canvasHeight * 0.75,
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACK CUANDO EL CANVAS ESTÁ LISTO
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCanvasReady = useCallback(async (fabricCanvas: any) => {
    if (!fabricCanvas) {
      console.error("Canvas not available");
      return;
    }

    const data = dataRef.current;
    console.log("Canvas ready, loading data:", data);

    try {
      const fabric = await getFabric();
      const canvasWidth = fabricCanvas.width || 400;
      const canvasHeight = fabricCanvas.height || 600;

      // 1. Color de fondo
      fabricCanvas.set({ backgroundColor: data.coverColor });
      fabricCanvas.renderAll();

      // 2. Imagen de fondo (con timeout extendido para base64)
      if (data.initialImage) {
        console.log("Loading background image...");
        try {
          await new Promise<void>((resolve) => {
            // Timeout de 15 segundos para imágenes base64 grandes
            const timeout = setTimeout(() => {
              console.warn(
                "Image load timeout (15s) - continuing without background image"
              );
              resolve();
            }, 15000);

            fabric.Image.fromURL(
              data.initialImage,
              (img: any) => {
                clearTimeout(timeout);

                if (img && img.width && img.height) {
                  // Calcular escala para cubrir todo el canvas (object-cover)
                  const scaleX = canvasWidth / img.width;
                  const scaleY = canvasHeight / img.height;
                  const scale = Math.max(scaleX, scaleY);

                  // Centrar la imagen
                  const scaledWidth = img.width * scale;
                  const scaledHeight = img.height * scale;

                  img.set({
                    left: (canvasWidth - scaledWidth) / 2,
                    top: (canvasHeight - scaledHeight) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    evented: false,
                    opacity: 0.9,
                  });

                  fabricCanvas.add(img);
                  fabricCanvas.sendToBack(img);
                  fabricCanvas.renderAll();
                  console.log("Background image loaded successfully");
                } else {
                  console.warn("Image loaded but has invalid dimensions");
                }
                resolve();
              },
              { crossOrigin: "anonymous" }
            );
          });
        } catch (err) {
          console.error("Error loading background image:", err);
        }
      }

      // 3. Posiciones según layout
      const positions = getLayoutPositions(canvasHeight, data.coverLayout);
      const fontFamily = getFontFamily(data.coverFont);

      // 4. Título
      if (data.title) {
        console.log("Adding title:", data.title);
        const titleText = new fabric.IText(data.title, {
          left: canvasWidth / 2,
          top: positions.titleY,
          fontSize: 42,
          fontFamily: fontFamily,
          fontWeight: "bold",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          textAlign: "center",
          shadow: "rgba(0,0,0,0.7) 2px 2px 8px",
        });
        fabricCanvas.add(titleText);
      }

      // 5. Subtítulo
      if (data.subtitle) {
        console.log("Adding subtitle:", data.subtitle);
        const subtitleText = new fabric.IText(data.subtitle, {
          left: canvasWidth / 2,
          top: positions.subtitleY,
          fontSize: 20,
          fontFamily: fontFamily,
          fontStyle: "italic",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          textAlign: "center",
          opacity: 0.9,
          shadow: "rgba(0,0,0,0.5) 1px 1px 4px",
        });
        fabricCanvas.add(subtitleText);
      }

      // 6. Autor
      if (data.author) {
        console.log("Adding author:", data.author);
        const authorText = new fabric.IText(data.author, {
          left: canvasWidth / 2,
          top: positions.authorY,
          fontSize: 22,
          fontFamily: "Inter, system-ui, sans-serif",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          textAlign: "center",
          opacity: 0.95,
          shadow: "rgba(0,0,0,0.5) 1px 1px 4px",
        });
        fabricCanvas.add(authorText);
      }

      // 7. Elementos decorativos (círculos)
      const circle1 = new fabric.Circle({
        left: canvasWidth - 90,
        top: 20,
        radius: 30,
        fill: "rgba(255,255,255,0.1)",
        selectable: true,
        evented: true,
      });
      fabricCanvas.add(circle1);

      const circle2 = new fabric.Circle({
        left: 20,
        top: canvasHeight - 80,
        radius: 24,
        fill: "rgba(255,255,255,0.1)",
        selectable: true,
        evented: true,
      });
      fabricCanvas.add(circle2);

      fabricCanvas.renderAll();
      console.log("Canvas initialization complete");
    } catch (error) {
      console.error("Error initializing canvas:", error);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleOpen = useCallback(() => {
    console.log("Opening editor with data:", dataRef.current);
    setCanvasKey((prev) => prev + 1);
    setIsOpen(true);
  }, []);

  const handleSaveDesign = useCallback(() => {
    if (!canvas) return;
    try {
      const designData = {
        canvasJson: canvas.toJSON(),
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem("advancedCoverDesign", JSON.stringify(designData));
      alert("Diseño guardado en la sesión");
    } catch (error) {
      console.error("Error saving design:", error);
    }
  }, [canvas]);

  const handleSave = useCallback(() => {
    if (!canvas) return;
    try {
      handleSaveDesign();
      const imageData = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });
      onSave?.(imageData);
      clear();
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving cover:", error);
    }
  }, [canvas, handleSaveDesign, onSave, clear]);

  const handleClose = useCallback(() => {
    clear();
    setIsOpen(false);
    onClose?.();
  }, [clear, onClose]);

  return (
    <>
      <Button onClick={handleOpen} variant="outline" size="sm">
        <Wand2 className="w-4 h-4 mr-2" />
        Edición Avanzada
      </Button>

      <FullscreenModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Editor Avanzado de Portada"
        description="Diseña tu portada con herramientas avanzadas similares a Canva Pro"
        onSave={handleSave}
        saveButtonText="Guardar Cambios"
        onSaveDesign={handleSaveDesign}
      >
        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 shrink-0">
          <Toolbar />
        </div>

        <div className="flex-1 overflow-hidden flex gap-4 p-6 bg-slate-950">
          <div className="flex-1 flex items-center justify-center">
            <Canvas key={canvasKey} onCanvasReady={handleCanvasReady} />
          </div>

          <div className="w-80 overflow-y-auto bg-slate-800 rounded-lg p-4">
            <PropertyPanel />
          </div>
        </div>
      </FullscreenModal>
    </>
  );
}
