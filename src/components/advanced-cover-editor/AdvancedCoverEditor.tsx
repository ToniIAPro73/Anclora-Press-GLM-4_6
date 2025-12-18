"use client";

/**
 * Advanced Cover Editor - FIXED VERSION
 *
 * CAMBIOS:
 * 1. Añadido onBeforeOpen para capturar la portada antes de abrir
 * 2. Añadidas props: subtitle, coverLayout, coverFont
 * 3. La imagen inicial ahora es la portada capturada (no solo la imagen de fondo)
 * 4. Mejorada la inicialización del canvas
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
  onBeforeOpen?: () => Promise<string | null>; // NUEVO: callback para capturar portada
  initialImage?: string;
  title?: string;
  subtitle?: string; // NUEVO
  author?: string;
  coverColor?: string;
  coverLayout?: string; // NUEVO
  coverFont?: string; // NUEVO
}

export default function AdvancedCoverEditor({
  onSave,
  onClose,
  onBeforeOpen,
  initialImage,
  title = "",
  subtitle = "",
  author = "",
  coverColor = "#ffffff",
  coverLayout = "centered",
  coverFont = "font-serif",
}: AdvancedCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { canvas, clear } = useCanvasStore();

  // ═══════════════════════════════════════════════════════════════════════════
  // ABRIR EDITOR - CAPTURAR PORTADA PRIMERO
  // ═══════════════════════════════════════════════════════════════════════════
  const handleOpen = useCallback(async () => {
    setIsLoading(true);

    try {
      // Si hay callback onBeforeOpen, capturar la portada
      if (onBeforeOpen) {
        const captured = await onBeforeOpen();
        if (captured) {
          setCapturedImage(captured);
        }
      }
    } catch (error) {
      console.error("Error capturing cover:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(true);
    }
  }, [onBeforeOpen]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZAR CANVAS CON IMAGEN CAPTURADA
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCanvasReady = useCallback(
    async (fabricCanvas: any) => {
      try {
        const fabric = await getFabric();

        // Usar la imagen capturada si existe, sino la imagen inicial
        const imageToUse = capturedImage || initialImage;

        // 1. Establecer fondo de color (como fallback)
        fabricCanvas.set({ backgroundColor: coverColor });

        // 2. Cargar imagen (portada capturada o imagen de fondo)
        if (imageToUse) {
          try {
            await new Promise<void>((resolve, reject) => {
              fabric.Image.fromURL(
                imageToUse,
                (img: any) => {
                  if (img) {
                    // Si es imagen capturada, ajustar para cubrir todo el canvas
                    const scale = Math.max(
                      fabricCanvas.width / (img.width || 1),
                      fabricCanvas.height / (img.height || 1)
                    );

                    img.set({
                      left: 0,
                      top: 0,
                      scaleX: scale,
                      scaleY: scale,
                      selectable: false, // No seleccionable como fondo
                      evented: false,
                      opacity: 1, // Opacidad completa para portada capturada
                    });

                    // Centrar la imagen
                    img.set({
                      left: (fabricCanvas.width - img.width * scale) / 2,
                      top: (fabricCanvas.height - img.height * scale) / 2,
                    });

                    fabricCanvas.add(img);
                    fabricCanvas.sendToBack(img);
                    fabricCanvas.renderAll();
                    resolve();
                  } else {
                    reject(new Error("Failed to load image"));
                  }
                },
                { crossOrigin: "anonymous" }
              );
            });

            // Si usamos la portada capturada, NO añadir texto
            // porque ya viene incluido en la imagen
            if (capturedImage) {
              fabricCanvas.renderAll();
              return;
            }
          } catch (error) {
            console.warn("Error loading background image:", error);
          }
        }

        // 3. Si NO hay imagen capturada, añadir elementos de texto
        // (solo cuando se usa imagen de fondo simple)
        if (!capturedImage) {
          // Añadir título si existe
          if (title) {
            const titleText = await addTextToCanvas(fabricCanvas, title, {
              left: fabricCanvas.width / 2,
              top: fabricCanvas.height * 0.7,
              fontSize: 48,
              fontFamily: getFontFamily(coverFont),
              fill: "#ffffff",
              originX: "center",
              originY: "center",
              textAlign: "center",
              shadow: "rgba(0,0,0,0.5) 2px 2px 4px",
            });
            fabricCanvas.add(titleText);
          }

          // Añadir subtítulo si existe
          if (subtitle) {
            const subtitleText = await addTextToCanvas(fabricCanvas, subtitle, {
              left: fabricCanvas.width / 2,
              top: fabricCanvas.height * 0.78,
              fontSize: 24,
              fontFamily: getFontFamily(coverFont),
              fill: "#ffffff",
              fontStyle: "italic",
              originX: "center",
              originY: "center",
              textAlign: "center",
              opacity: 0.9,
            });
            fabricCanvas.add(subtitleText);
          }

          // Añadir autor si existe
          if (author) {
            const authorText = await addTextToCanvas(fabricCanvas, author, {
              left: fabricCanvas.width / 2,
              top: fabricCanvas.height * 0.88,
              fontSize: 20,
              fontFamily: "Inter, sans-serif",
              fill: "#ffffff",
              originX: "center",
              originY: "center",
              textAlign: "center",
              opacity: 0.9,
            });
            fabricCanvas.add(authorText);
          }
        }

        fabricCanvas.renderAll();
      } catch (error) {
        console.error("Error loading initial content:", error);
      }
    },
    [
      coverColor,
      initialImage,
      capturedImage,
      title,
      subtitle,
      author,
      coverFont,
    ]
  );

  // Mapear clase de fuente a nombre de fuente
  const getFontFamily = (fontClass: string): string => {
    const fontMap: Record<string, string> = {
      "font-serif": "Libre Baskerville, Georgia, serif",
      "font-playfair": "Playfair Display, Georgia, serif",
      "font-merriweather": "Merriweather, Georgia, serif",
      "font-sans": "Inter, system-ui, sans-serif",
      "font-montserrat": "Montserrat, system-ui, sans-serif",
      "font-opensans": "Open Sans, system-ui, sans-serif",
    };
    return fontMap[fontClass] || "Georgia, serif";
  };

  // Guardar diseño a nivel de sesión
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
      // Guardar diseño en sesión
      handleSaveDesign();

      // Exportar como imagen
      const imageData = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      onSave?.(imageData);

      // Limpiar y cerrar
      clear();
      setCapturedImage(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving cover:", error);
    }
  }, [canvas, handleSaveDesign, onSave, clear]);

  const handleClose = useCallback(() => {
    clear();
    setCapturedImage(null);
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
        {isLoading ? (
          <>
            <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Cargando...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Edición Avanzada
          </>
        )}
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
