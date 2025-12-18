"use client";

/**
 * Advanced Cover Editor - VERSION 2
 *
 * Reconstruye la portada completa en Fabric.js usando los datos originales
 * en lugar de capturar con html2canvas (que tiene problemas con oklch y backdrop-blur)
 */

import { useState, useCallback } from "react";
import { useCanvasStore } from "@/lib/canvas-store";
import { getFabric, addTextToCanvas } from "@/lib/canvas-utils";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import PropertyPanel from "./PropertyPanel";
import FullscreenModal from "./FullscreenModal";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface AdvancedCoverEditorProps {
  onSave?: (imageData: string) => void;
  onClose?: () => void;
  initialImage?: string; // Imagen de fondo
  title?: string;
  subtitle?: string;
  author?: string;
  coverColor?: string;
  coverLayout?: string; // 'centered' | 'top' | 'bottom' | 'split'
  coverFont?: string; // Clase de fuente CSS
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
  const [isLoading, setIsLoading] = useState(false);
  const { canvas, clear } = useCanvasStore();

  // ═══════════════════════════════════════════════════════════════════════════
  // MAPEO DE FUENTES CSS A FUENTES DE FABRIC.JS
  // ═══════════════════════════════════════════════════════════════════════════
  const getFontFamily = (fontClass: string): string => {
    const fontMap: Record<string, string> = {
      "font-serif": "Georgia, serif",
      "font-playfair": "Playfair Display, Georgia, serif",
      "font-merriweather": "Merriweather, Georgia, serif",
      "font-lora": "Lora, Georgia, serif",
      "font-crimson": "Crimson Text, Georgia, serif",
      "font-cormorant": "Cormorant Garamond, Georgia, serif",
      "font-sans": "Inter, system-ui, sans-serif",
      "font-poppins": "Poppins, system-ui, sans-serif",
      "font-raleway": "Raleway, system-ui, sans-serif",
      "font-roboto": "Roboto, system-ui, sans-serif",
      "font-montserrat": "Montserrat, system-ui, sans-serif",
      "font-oswald": "Oswald, system-ui, sans-serif",
      "font-bebas": "Bebas Neue, system-ui, sans-serif",
      "font-mono": "JetBrains Mono, monospace",
      "font-caveat": "Caveat, cursive",
      "font-pacifico": "Pacifico, cursive",
    };
    return fontMap[fontClass] || "Georgia, serif";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULAR POSICIONES SEGÚN LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  const getLayoutPositions = (
    canvasWidth: number,
    canvasHeight: number,
    layout: string
  ) => {
    const padding = 40;

    switch (layout) {
      case "top":
        return {
          titleY: canvasHeight * 0.15,
          subtitleY: canvasHeight * 0.25,
          authorY: canvasHeight * 0.85,
          align: "center",
        };
      case "bottom":
        return {
          titleY: canvasHeight * 0.65,
          subtitleY: canvasHeight * 0.75,
          authorY: canvasHeight * 0.88,
          align: "center",
        };
      case "split":
        return {
          titleY: canvasHeight * 0.12,
          subtitleY: canvasHeight * 0.2,
          authorY: canvasHeight * 0.9,
          align: "center",
        };
      case "centered":
      default:
        return {
          titleY: canvasHeight * 0.55,
          subtitleY: canvasHeight * 0.65,
          authorY: canvasHeight * 0.75,
          align: "center",
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZAR CANVAS CON LA PORTADA RECONSTRUIDA
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCanvasReady = useCallback(
    async (fabricCanvas: any) => {
      try {
        const fabric = await getFabric();
        const canvasWidth = fabricCanvas.width || 400;
        const canvasHeight = fabricCanvas.height || 600;

        // 1. Establecer color de fondo
        fabricCanvas.set({ backgroundColor: coverColor });

        // 2. Cargar imagen de fondo si existe
        if (initialImage) {
          await new Promise<void>((resolve) => {
            fabric.Image.fromURL(
              initialImage,
              (img: any) => {
                if (img && img.width && img.height) {
                  // Calcular escala para cubrir todo el canvas (como object-cover)
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
                    opacity: 0.9, // Ligeramente transparente como en la portada original
                  });

                  fabricCanvas.add(img);
                  fabricCanvas.sendToBack(img);
                }
                resolve();
              },
              { crossOrigin: "anonymous" }
            );
          });
        }

        // 3. Obtener posiciones según el layout
        const positions = getLayoutPositions(
          canvasWidth,
          canvasHeight,
          coverLayout
        );
        const fontFamily = getFontFamily(coverFont);

        // 4. Añadir título
        if (title) {
          const titleText = await addTextToCanvas(fabricCanvas, title, {
            left: canvasWidth / 2,
            top: positions.titleY,
            fontSize: 42,
            fontFamily: fontFamily,
            fontWeight: "bold",
            fill: "#ffffff",
            originX: "center",
            originY: "center",
            textAlign: "center",
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.7)",
              blur: 8,
              offsetX: 2,
              offsetY: 2,
            }),
          });
          fabricCanvas.add(titleText);
        }

        // 5. Añadir subtítulo
        if (subtitle) {
          const subtitleText = await addTextToCanvas(fabricCanvas, subtitle, {
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
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.5)",
              blur: 4,
              offsetX: 1,
              offsetY: 1,
            }),
          });
          fabricCanvas.add(subtitleText);
        }

        // 6. Añadir autor
        if (author) {
          const authorText = await addTextToCanvas(fabricCanvas, author, {
            left: canvasWidth / 2,
            top: positions.authorY,
            fontSize: 22,
            fontFamily: "Inter, system-ui, sans-serif",
            fill: "#ffffff",
            originX: "center",
            originY: "center",
            textAlign: "center",
            opacity: 0.95,
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.5)",
              blur: 4,
              offsetX: 1,
              offsetY: 1,
            }),
          });
          fabricCanvas.add(authorText);
        }

        // 7. Añadir elementos decorativos (círculos como en la portada original)
        const circle1 = new fabric.Circle({
          left: canvasWidth - 60,
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
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    },
    [coverColor, initialImage, title, subtitle, author, coverLayout, coverFont]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleOpen = useCallback(() => {
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
      <Button
        onClick={handleOpen}
        variant="outline"
        size="sm"
        disabled={isLoading}
      >
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
        {/* Toolbar */}
        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 shrink-0">
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
      </FullscreenModal>
    </>
  );
}
