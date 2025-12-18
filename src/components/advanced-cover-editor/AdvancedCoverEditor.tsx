"use client";

/**
 * Advanced Cover Editor - VERSION 5
 *
 * CORRECCIONES:
 * 1. Objetos con ID para que PropertyPanel funcione
 * 2. Elementos registrados en el store con addElement
 * 3. FontSize reducido para que quepa en el canvas
 * 4. Carga de imagen base64 mejorada usando Image element nativo
 * 5. Selección de elementos funcional
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
  const { canvas, clear, addElement } = useCanvasStore();

  // Refs para los datos actuales
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
          titleY: canvasHeight * 0.18,
          subtitleY: canvasHeight * 0.28,
          authorY: canvasHeight * 0.88,
        };
      case "bottom":
        return {
          titleY: canvasHeight * 0.68,
          subtitleY: canvasHeight * 0.78,
          authorY: canvasHeight * 0.9,
        };
      case "split":
        return {
          titleY: canvasHeight * 0.15,
          subtitleY: canvasHeight * 0.25,
          authorY: canvasHeight * 0.92,
        };
      default: // centered
        return {
          titleY: canvasHeight * 0.58,
          subtitleY: canvasHeight * 0.68,
          authorY: canvasHeight * 0.8,
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIÓN MEJORADA PARA CARGAR IMAGEN BASE64
  // ═══════════════════════════════════════════════════════════════════════════
  const loadImageToCanvas = async (
    fabric: any,
    fabricCanvas: any,
    imageUrl: string,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      // Crear elemento Image nativo para precargar
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        console.log("Native image loaded:", img.width, "x", img.height);

        // Crear fabric.Image desde el elemento Image nativo
        const fabricImg = new fabric.Image(img, {
          selectable: false,
          evented: false,
          opacity: 0.9,
        });

        // Calcular escala para cubrir todo el canvas
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.max(scaleX, scaleY);

        // Centrar la imagen
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        fabricImg.set({
          left: (canvasWidth - scaledWidth) / 2,
          top: (canvasHeight - scaledHeight) / 2,
          scaleX: scale,
          scaleY: scale,
        });

        fabricCanvas.add(fabricImg);
        fabricCanvas.sendToBack(fabricImg);
        fabricCanvas.renderAll();

        console.log("Background image added to canvas");
        resolve(true);
      };

      img.onerror = (err) => {
        console.error("Error loading image:", err);
        resolve(false);
      };

      // Iniciar carga
      img.src = imageUrl;
    });
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

      // 2. Imagen de fondo
      if (data.initialImage) {
        console.log("Loading background image...");
        await loadImageToCanvas(
          fabric,
          fabricCanvas,
          data.initialImage,
          canvasWidth,
          canvasHeight
        );
      }

      // 3. Posiciones según layout
      const positions = getLayoutPositions(canvasHeight, data.coverLayout);
      const fontFamily = getFontFamily(data.coverFont);

      // 4. Título (fontSize reducido para que quepa)
      if (data.title) {
        const titleId = `title-${Date.now()}`;
        const titleText = new fabric.IText(data.title, {
          id: titleId,
          left: canvasWidth / 2,
          top: positions.titleY,
          fontSize: 28, // Reducido de 42 a 28
          fontFamily: fontFamily,
          fontWeight: "bold",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          textAlign: "center",
          shadow: "rgba(0,0,0,0.7) 2px 2px 6px",
        });
        fabricCanvas.add(titleText);

        // Registrar en el store
        useCanvasStore.getState().addElement({
          id: titleId,
          type: "text",
          object: titleText,
          properties: {
            fill: "#ffffff",
            fontSize: 28,
            fontFamily: fontFamily,
            opacity: 1,
          },
        });

        console.log("Title added:", data.title);
      }

      // 5. Subtítulo
      if (data.subtitle) {
        const subtitleId = `subtitle-${Date.now()}`;
        const subtitleText = new fabric.IText(data.subtitle, {
          id: subtitleId,
          left: canvasWidth / 2,
          top: positions.subtitleY,
          fontSize: 16, // Reducido de 20 a 16
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

        useCanvasStore.getState().addElement({
          id: subtitleId,
          type: "text",
          object: subtitleText,
          properties: {
            fill: "#ffffff",
            fontSize: 16,
            fontFamily: fontFamily,
            opacity: 0.9,
          },
        });

        console.log("Subtitle added:", data.subtitle);
      }

      // 6. Autor
      if (data.author) {
        const authorId = `author-${Date.now()}`;
        const authorText = new fabric.IText(data.author, {
          id: authorId,
          left: canvasWidth / 2,
          top: positions.authorY,
          fontSize: 18, // Reducido de 22 a 18
          fontFamily: "Inter, system-ui, sans-serif",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          textAlign: "center",
          opacity: 0.95,
          shadow: "rgba(0,0,0,0.5) 1px 1px 4px",
        });
        fabricCanvas.add(authorText);

        useCanvasStore.getState().addElement({
          id: authorId,
          type: "text",
          object: authorText,
          properties: {
            fill: "#ffffff",
            fontSize: 18,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: 0.95,
          },
        });

        console.log("Author added:", data.author);
      }

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
