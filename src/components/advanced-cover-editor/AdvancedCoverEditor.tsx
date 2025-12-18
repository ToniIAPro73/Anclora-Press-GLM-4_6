"use client";

/**
 * Advanced Cover Editor - VERSION 10
 *
 * COMPORTAMIENTO:
 * - Canvas replica EXACTAMENTE la portada del editor básico
 * - Imagen de fondo: SELECCIONABLE
 * - Textos (título, subtítulo, autor): SELECCIONABLES
 * - Panel derecho muestra propiedades del elemento seleccionado
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

  const dataRef = useRef({
    initialImage,
    title,
    subtitle,
    author,
    coverColor,
    coverLayout,
    coverFont,
  });

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

  // ═══════════════════════════════════════════════════════════════════════════
  // MAPEO DE FUENTES
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // POSICIONES SEGÚN LAYOUT (coinciden con el editor básico)
  // ═══════════════════════════════════════════════════════════════════════════
  const getLayoutPositions = (layout: string) => {
    switch (layout) {
      case "top":
        return { titleY: 0.15, subtitleY: 0.26, authorY: 0.88 };
      case "bottom":
        return { titleY: 0.58, subtitleY: 0.69, authorY: 0.88 };
      case "split":
        return { titleY: 0.12, subtitleY: 0.23, authorY: 0.92 };
      default: // centered
        return { titleY: 0.48, subtitleY: 0.6, authorY: 0.78 };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR IMAGEN (SELECCIONABLE)
  // ═══════════════════════════════════════════════════════════════════════════
  const loadSelectableImage = async (
    fabric: any,
    fabricCanvas: any,
    imageUrl: string,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<any> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const imageId = `background-${Date.now()}`;

        const fabricImg = new fabric.Image(img, {
          id: imageId,
          // SELECCIONABLE para poder editarla
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
        });

        // Escalar para cubrir todo el canvas (object-cover)
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.max(scaleX, scaleY);

        fabricImg.set({
          left: (canvasWidth - img.width * scale) / 2,
          top: (canvasHeight - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        });

        fabricCanvas.add(fabricImg);

        // Enviar al fondo pero mantener seleccionable
        try {
          if (fabricCanvas.sendObjectToBack) {
            fabricCanvas.sendObjectToBack(fabricImg);
          } else if (fabricCanvas.sendToBack) {
            fabricCanvas.sendToBack(fabricImg);
          } else {
            fabricCanvas.moveTo(fabricImg, 0);
          }
        } catch (e) {
          console.warn("sendToBack:", e);
        }

        // Registrar en el store
        useCanvasStore.getState().addElement({
          id: imageId,
          type: "image",
          object: fabricImg,
          properties: { opacity: 1 },
        });

        fabricCanvas.renderAll();
        resolve(fabricImg);
      };

      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREAR TEXTO SELECCIONABLE
  // ═══════════════════════════════════════════════════════════════════════════
  const createSelectableText = (
    fabric: any,
    fabricCanvas: any,
    text: string,
    options: {
      id: string;
      top: number;
      fontSize: number;
      fontFamily: string;
      fontWeight?: string;
      fontStyle?: string;
      opacity?: number;
    }
  ) => {
    const canvasWidth = fabricCanvas.width || 400;

    const textObj = new fabric.Textbox(text, {
      id: options.id,
      left: canvasWidth / 2,
      top: options.top,
      width: canvasWidth * 0.85,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      fontWeight: options.fontWeight || "normal",
      fontStyle: options.fontStyle || "normal",
      fill: "#ffffff",
      originX: "center",
      originY: "center",
      textAlign: "center",
      opacity: options.opacity || 1,
      shadow: "rgba(0,0,0,0.7) 2px 2px 8px",
      // SELECCIONABLE
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
    });

    fabricCanvas.add(textObj);

    // Registrar en el store
    useCanvasStore.getState().addElement({
      id: options.id,
      type: "text",
      object: textObj,
      properties: {
        fill: "#ffffff",
        fontSize: options.fontSize,
        fontFamily: options.fontFamily,
        opacity: options.opacity || 1,
      },
    });

    return textObj;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACK CUANDO EL CANVAS ESTÁ LISTO
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCanvasReady = useCallback(async (fabricCanvas: any) => {
    if (!fabricCanvas) return;

    const data = dataRef.current;
    console.log("Reconstructing cover with:", data);

    try {
      const fabric = await getFabric();
      const canvasWidth = fabricCanvas.width || 400;
      const canvasHeight = fabricCanvas.height || 600;

      // 1. COLOR DE FONDO
      fabricCanvas.set({ backgroundColor: data.coverColor });

      // 2. IMAGEN DE FONDO (SELECCIONABLE)
      if (data.initialImage) {
        await loadSelectableImage(
          fabric,
          fabricCanvas,
          data.initialImage,
          canvasWidth,
          canvasHeight
        );
      }

      // 3. POSICIONES Y FUENTES
      const positions = getLayoutPositions(data.coverLayout);
      const fontFamily = getFontFamily(data.coverFont);

      // 4. TÍTULO (SELECCIONABLE)
      if (data.title) {
        // Calcular fontSize basado en longitud
        let titleFontSize = 32;
        if (data.title.length > 25) titleFontSize = 28;
        if (data.title.length > 40) titleFontSize = 24;
        if (data.title.length > 60) titleFontSize = 20;

        createSelectableText(fabric, fabricCanvas, data.title, {
          id: `title-${Date.now()}`,
          top: canvasHeight * positions.titleY,
          fontSize: titleFontSize,
          fontFamily: fontFamily,
          fontWeight: "bold",
        });
      }

      // 5. SUBTÍTULO (SELECCIONABLE)
      if (data.subtitle) {
        createSelectableText(fabric, fabricCanvas, data.subtitle, {
          id: `subtitle-${Date.now()}`,
          top: canvasHeight * positions.subtitleY,
          fontSize: 16,
          fontFamily: fontFamily,
          fontStyle: "italic",
          opacity: 0.9,
        });
      }

      // 6. AUTOR (SELECCIONABLE)
      if (data.author) {
        createSelectableText(fabric, fabricCanvas, data.author, {
          id: `author-${Date.now()}`,
          top: canvasHeight * positions.authorY,
          fontSize: 18,
          fontFamily: "Inter, system-ui, sans-serif",
        });
      }

      fabricCanvas.renderAll();
      console.log("Cover reconstruction complete - all elements selectable");
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleOpen = useCallback(() => {
    setCanvasKey((prev) => prev + 1);
    setIsOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!canvas) return;
    try {
      const imageData = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });
      onSave?.(imageData);
      clear();
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  }, [canvas, onSave, clear]);

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
        description="Selecciona cualquier elemento para editarlo"
        onSave={handleSave}
        saveButtonText="Guardar Cambios"
      >
        <div className="flex-1 overflow-hidden flex bg-slate-950">
          {/* Sidebar izquierda con herramientas */}
          <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-2">
            <Toolbar vertical />
          </div>

          {/* Canvas centrado */}
          <div className="flex-1 flex items-center justify-center p-4">
            <Canvas key={canvasKey} onCanvasReady={handleCanvasReady} />
          </div>

          {/* Panel de propiedades */}
          <div className="w-72 overflow-y-auto bg-slate-800 border-l border-slate-700 p-4">
            <PropertyPanel />
          </div>
        </div>
      </FullscreenModal>
    </>
  );
}
