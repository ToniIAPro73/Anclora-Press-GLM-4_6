'use client';

import { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import { useCanvasStore } from '@/lib/canvas-store';
import { getFabric } from '@/lib/canvas-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Trash2, Copy } from 'lucide-react';

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Playfair Display',
  'Inter',
  'Lora',
  'Merriweather',
];

export default function PropertyPanel() {
  const { selectedElement, canvas } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localElement, setLocalElement] = useState<any>(null);

  useEffect(() => {
    setLocalElement(selectedElement);
  }, [selectedElement]);

  if (!selectedElement || !canvas) {
    return (
      <Card className="w-full bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Propiedades</CardTitle>
          <CardDescription className="text-slate-400">Selecciona un elemento para editar</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleColorChange = (color: any) => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject) {
      fabricObject.set({ fill: color.hex });
      canvas.renderAll();
      setLocalElement({ ...localElement, properties: { ...localElement.properties, fill: color.hex } });
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject && fabricObject.fontSize !== undefined) {
      fabricObject.set({ fontSize: value[0] });
      canvas.renderAll();
      setLocalElement({ ...localElement, properties: { ...localElement.properties, fontSize: value[0] } });
    }
  };

  const handleFontFamilyChange = (family: string) => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject && fabricObject.fontFamily !== undefined) {
      fabricObject.set({ fontFamily: family });
      canvas.renderAll();
      setLocalElement({ ...localElement, properties: { ...localElement.properties, fontFamily: family } });
    }
  };

  const handleOpacityChange = (value: number[]) => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject) {
      fabricObject.set({ opacity: value[0] / 100 });
      canvas.renderAll();
      setLocalElement({ ...localElement, properties: { ...localElement.properties, opacity: value[0] / 100 } });
    }
  };

  const handleTextChange = (newText: string) => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject && fabricObject.text !== undefined) {
      fabricObject.set({ text: newText });
      canvas.renderAll();
      setLocalElement({ ...localElement, properties: { ...localElement.properties, text: newText } });
    }
  };

  const handleDelete = () => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject) {
      canvas.remove(fabricObject);
      canvas.renderAll();
    }
  };

  const handleDuplicate = async () => {
    const fabricObject = canvas.getObjects().find((obj: any) => obj.id === selectedElement.id);
    if (fabricObject) {
      const fabric = await getFabric();
      const clonedObject = await new Promise<any>((resolve) => {
        fabricObject.clone((cloned: any) => {
          cloned.set({
            left: fabricObject.left + 20,
            top: fabricObject.top + 20,
            id: `${Date.now()}-${Math.random()}`,
          });
          resolve(cloned);
        });
      });
      canvas.add(clonedObject);
      canvas.renderAll();
    }
  };

  const isTextElement = selectedElement.type === 'text';
  const isImageElement = selectedElement.type === 'image';

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Propiedades</CardTitle>
        <CardDescription className="text-slate-400">
          {isTextElement ? 'Texto' : isImageElement ? 'Imagen' : 'Elemento'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Content (solo para texto) */}
        {isTextElement && (
          <div className="space-y-2">
            <Label className="text-white">Contenido</Label>
            <Input
              type="text"
              value={localElement?.properties?.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Edita el texto aquí"
              className="bg-slate-700 text-white border-slate-600 placeholder-slate-500"
            />
          </div>
        )}

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-white">Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border-2 border-slate-600 cursor-pointer"
              style={{ backgroundColor: localElement?.properties?.fill || '#000000' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <span className="text-sm text-slate-300">{localElement?.properties?.fill || '#000000'}</span>
          </div>
          {showColorPicker && (
            <div className="absolute z-50 mt-2">
              <ChromePicker
                color={localElement?.properties?.fill || '#000000'}
                onChange={handleColorChange}
              />
            </div>
          )}
        </div>

        {/* Font Size (solo para texto) */}
        {isTextElement && (
          <div className="space-y-2">
            <Label className="text-white">Tamaño de Fuente</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[localElement?.properties?.fontSize || 24]}
                onValueChange={handleFontSizeChange}
                min={8}
                max={120}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right text-slate-300">{localElement?.properties?.fontSize || 24}px</span>
            </div>
          </div>
        )}

        {/* Font Family (solo para texto) */}
        {isTextElement && (
          <div className="space-y-2">
            <Label className="text-white">Fuente</Label>
            <Select
              value={localElement?.properties?.fontFamily || 'Arial'}
              onValueChange={handleFontFamilyChange}
            >
              <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 text-white border-slate-600">
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font} className="text-white">
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-2">
          <Label className="text-white">Opacidad</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[(localElement?.properties?.opacity || 1) * 100]}
              onValueChange={handleOpacityChange}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm w-12 text-right text-slate-300">{Math.round((localElement?.properties?.opacity || 1) * 100)}%</span>
          </div>
        </div>

        {/* Dimensiones (solo para imágenes) */}
        {isImageElement && (
          <>
            <div className="space-y-2">
              <Label className="text-white">Ancho</Label>
              <Input
                type="number"
                value={localElement?.properties?.width || 0}
                disabled
                className="bg-slate-700 text-slate-400 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Alto</Label>
              <Input
                type="number"
                value={localElement?.properties?.height || 0}
                disabled
                className="bg-slate-700 text-slate-400 border-slate-600"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-slate-700">
          <Button
            onClick={handleDuplicate}
            variant="outline"
            className="w-full bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
