"use client";

/**
 * PropertyPanel - VERSION MEJORADA
 *
 * Maneja correctamente:
 * - Textbox (texto multilínea)
 * - IText (texto simple)
 * - Image (imágenes)
 */

import { useState, useEffect } from "react";
import { ChromePicker } from "react-color";
import { useCanvasStore } from "@/lib/canvas-store";
import { getFabric } from "@/lib/canvas-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Trash2, Copy } from "lucide-react";

const fontFamilies = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Playfair Display",
  "Inter",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Helvetica",
  "Verdana",
];

export default function PropertyPanel() {
  const { selectedElement, canvas } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localProps, setLocalProps] = useState<any>({});

  // Sincronizar propiedades locales con el elemento seleccionado
  useEffect(() => {
    if (selectedElement?.object) {
      const obj = selectedElement.object;
      setLocalProps({
        text: obj.text || "",
        fill: obj.fill || "#ffffff",
        fontSize: obj.fontSize || 24,
        fontFamily: obj.fontFamily || "Georgia",
        opacity: (obj.opacity || 1) * 100,
        fontWeight: obj.fontWeight || "normal",
        fontStyle: obj.fontStyle || "normal",
      });
    }
  }, [selectedElement]);

  // Si no hay elemento seleccionado
  if (!selectedElement || !canvas) {
    return (
      <Card className="w-full bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Propiedades</CardTitle>
          <CardDescription className="text-slate-400">
            Selecciona un elemento para editar
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const fabricObject = selectedElement.object;
  const isTextElement =
    selectedElement.type === "text" ||
    fabricObject?.type === "textbox" ||
    fabricObject?.type === "i-text";
  const isImageElement =
    selectedElement.type === "image" || fabricObject?.type === "image";

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTextChange = (newText: string) => {
    if (fabricObject) {
      fabricObject.set({ text: newText });
      canvas.renderAll();
      setLocalProps({ ...localProps, text: newText });
    }
  };

  const handleColorChange = (color: any) => {
    if (fabricObject) {
      fabricObject.set({ fill: color.hex });
      canvas.renderAll();
      setLocalProps({ ...localProps, fill: color.hex });
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    if (fabricObject && isTextElement) {
      fabricObject.set({ fontSize: value[0] });
      canvas.renderAll();
      setLocalProps({ ...localProps, fontSize: value[0] });
    }
  };

  const handleFontFamilyChange = (family: string) => {
    if (fabricObject && isTextElement) {
      fabricObject.set({ fontFamily: family });
      canvas.renderAll();
      setLocalProps({ ...localProps, fontFamily: family });
    }
  };

  const handleOpacityChange = (value: number[]) => {
    if (fabricObject) {
      fabricObject.set({ opacity: value[0] / 100 });
      canvas.renderAll();
      setLocalProps({ ...localProps, opacity: value[0] });
    }
  };

  const handleBoldToggle = () => {
    if (fabricObject && isTextElement) {
      const newWeight = localProps.fontWeight === "bold" ? "normal" : "bold";
      fabricObject.set({ fontWeight: newWeight });
      canvas.renderAll();
      setLocalProps({ ...localProps, fontWeight: newWeight });
    }
  };

  const handleItalicToggle = () => {
    if (fabricObject && isTextElement) {
      const newStyle = localProps.fontStyle === "italic" ? "normal" : "italic";
      fabricObject.set({ fontStyle: newStyle });
      canvas.renderAll();
      setLocalProps({ ...localProps, fontStyle: newStyle });
    }
  };

  const handleDelete = () => {
    if (fabricObject) {
      canvas.remove(fabricObject);
      canvas.discardActiveObject();
      canvas.renderAll();
      useCanvasStore.getState().selectElement(null);
    }
  };

  const handleDuplicate = async () => {
    if (!fabricObject) return;

    try {
      fabricObject.clone((cloned: any) => {
        cloned.set({
          left: (fabricObject.left || 0) + 20,
          top: (fabricObject.top || 0) + 20,
          id: `clone-${Date.now()}`,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    } catch (error) {
      console.error("Error duplicating:", error);
    }
  };

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Propiedades</CardTitle>
        <CardDescription className="text-slate-400">
          {isTextElement
            ? "📝 Texto"
            : isImageElement
            ? "🖼️ Imagen"
            : "📦 Elemento"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TEXTO (solo para elementos de texto) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isTextElement && (
          <div className="space-y-2">
            <Label className="text-white text-sm">Contenido</Label>
            <Textarea
              value={localProps.text || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Escribe aquí..."
              className="bg-slate-700 text-white border-slate-600 min-h-20 resize-none"
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FUENTE (solo para texto) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isTextElement && (
          <>
            <div className="space-y-2">
              <Label className="text-white text-sm">Fuente</Label>
              <Select
                value={localProps.fontFamily || "Georgia"}
                onValueChange={handleFontFamilyChange}
              >
                <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 text-white border-slate-600">
                  {fontFamilies.map((font) => (
                    <SelectItem
                      key={font}
                      value={font}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm">
                Tamaño: {localProps.fontSize || 24}px
              </Label>
              <Slider
                value={[localProps.fontSize || 24]}
                onValueChange={handleFontSizeChange}
                min={10}
                max={72}
                step={1}
                className="py-2"
              />
            </div>

            {/* Negrita / Cursiva */}
            <div className="flex gap-2">
              <Button
                onClick={handleBoldToggle}
                variant={
                  localProps.fontWeight === "bold" ? "default" : "outline"
                }
                size="sm"
                className={
                  localProps.fontWeight === "bold"
                    ? "bg-lime-500 text-black"
                    : "bg-slate-700 text-white border-slate-600"
                }
              >
                <strong>B</strong>
              </Button>
              <Button
                onClick={handleItalicToggle}
                variant={
                  localProps.fontStyle === "italic" ? "default" : "outline"
                }
                size="sm"
                className={
                  localProps.fontStyle === "italic"
                    ? "bg-lime-500 text-black"
                    : "bg-slate-700 text-white border-slate-600"
                }
              >
                <em>I</em>
              </Button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLOR (solo para texto) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isTextElement && (
          <div className="space-y-2">
            <Label className="text-white text-sm">Color</Label>
            <div
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full h-10 rounded-md cursor-pointer border-2 border-slate-600 hover:border-slate-500 transition-colors"
              style={{ backgroundColor: localProps.fill || "#ffffff" }}
            />
            {showColorPicker && (
              <div className="absolute z-50 mt-2">
                <div
                  className="fixed inset-0"
                  onClick={() => setShowColorPicker(false)}
                />
                <div className="relative">
                  <ChromePicker
                    color={localProps.fill || "#ffffff"}
                    onChange={handleColorChange}
                    disableAlpha
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* OPACIDAD (para todos los elementos) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <Label className="text-white text-sm">
            Opacidad: {Math.round(localProps.opacity || 100)}%
          </Label>
          <Slider
            value={[localProps.opacity || 100]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={1}
            className="py-2"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ACCIONES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex gap-2 pt-4 border-t border-slate-700">
          <Button
            onClick={handleDuplicate}
            variant="outline"
            size="sm"
            className="flex-1 bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="flex-1 bg-red-900/50 text-red-300 border-red-800 hover:bg-red-900"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
