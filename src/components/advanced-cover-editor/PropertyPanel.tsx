'use client';

import { useState } from 'react';
import { ChromePicker } from 'react-color';
import { useCanvasStore } from '@/lib/canvas-store';
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
import { Trash2 } from 'lucide-react';

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
];

export default function PropertyPanel() {
  const { selectedElement, updateElement, removeElement } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!selectedElement) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Propiedades</CardTitle>
          <CardDescription>Selecciona un elemento para editar</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleColorChange = (color: any) => {
    updateElement(selectedElement.id, { fill: color.hex });
  };

  const handleFontSizeChange = (value: number[]) => {
    updateElement(selectedElement.id, { fontSize: value[0] });
  };

  const handleFontFamilyChange = (family: string) => {
    updateElement(selectedElement.id, { fontFamily: family });
  };

  const handleOpacityChange = (value: number[]) => {
    updateElement(selectedElement.id, { opacity: value[0] / 100 });
  };

  const handleDelete = () => {
    removeElement(selectedElement.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Propiedades</CardTitle>
        <CardDescription>{selectedElement.type === 'text' ? 'Texto' : 'Imagen'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
              style={{ backgroundColor: selectedElement.properties.fill || '#000000' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <span className="text-sm text-gray-600">{selectedElement.properties.fill || '#000000'}</span>
          </div>
          {showColorPicker && (
            <div className="absolute z-50 mt-2">
              <ChromePicker
                color={selectedElement.properties.fill || '#000000'}
                onChange={handleColorChange}
              />
            </div>
          )}
        </div>

        {/* Font Size (solo para texto) */}
        {selectedElement.type === 'text' && (
          <div className="space-y-2">
            <Label>Tamaño de Fuente</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[selectedElement.properties.fontSize || 24]}
                onValueChange={handleFontSizeChange}
                min={8}
                max={72}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{selectedElement.properties.fontSize || 24}px</span>
            </div>
          </div>
        )}

        {/* Font Family (solo para texto) */}
        {selectedElement.type === 'text' && (
          <div className="space-y-2">
            <Label>Fuente</Label>
            <Select
              value={selectedElement.properties.fontFamily || 'Arial'}
              onValueChange={handleFontFamilyChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacidad</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[(selectedElement.properties.opacity || 1) * 100]}
              onValueChange={handleOpacityChange}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm w-12 text-right">{Math.round((selectedElement.properties.opacity || 1) * 100)}%</span>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          onClick={handleDelete}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar
        </Button>
      </CardContent>
    </Card>
  );
}
