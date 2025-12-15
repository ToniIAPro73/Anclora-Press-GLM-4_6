'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas-store';
import { getFabric, addTextToCanvas } from '@/lib/canvas-utils';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertyPanel from './PropertyPanel';
import FullscreenModal from './FullscreenModal';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

interface AdvancedCoverEditorProps {
  onSave?: (imageData: string) => void;
  onClose?: () => void;
  initialImage?: string;
  title?: string;
  author?: string;
  coverColor?: string;
}

export default function AdvancedCoverEditor({
  onSave,
  onClose,
  initialImage,
  title = '',
  author = '',
  coverColor = '#ffffff',
}: AdvancedCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canvas, clear } = useCanvasStore();

  const handleCanvasReady = useCallback(
    async (fabricCanvas: any) => {
      try {
        const fabric = await getFabric();

        // 1. Establecer fondo de color
        fabricCanvas.set({ backgroundColor: coverColor });

        // 2. Cargar imagen de fondo si existe
        if (initialImage) {
          try {
            fabric.Image.fromURL(
              initialImage,
              (img: any) => {
                if (img) {
                  img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                    opacity: 0.8,
                  });
                  // Escalar imagen para que cubra el canvas
                  const scale = Math.max(
                    fabricCanvas.width / (img.width || 1),
                    fabricCanvas.height / (img.height || 1)
                  );
                  img.scale(scale);
                  fabricCanvas.add(img);
                  fabricCanvas.sendToBack(img);
                  fabricCanvas.renderAll();
                }
              },
              { crossOrigin: 'anonymous' }
            );
          } catch (error) {
            console.warn('Error loading background image:', error);
          }
        }

        // 3. Agregar título si existe
        if (title) {
          const titleText = await addTextToCanvas(fabricCanvas, title, {
            left: fabricCanvas.width / 2,
            top: fabricCanvas.height - 150,
            fontSize: 48,
            fontFamily: 'Playfair Display',
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
          });
          fabricCanvas.add(titleText);
        }

        // 4. Agregar autor si existe
        if (author) {
          const authorText = await addTextToCanvas(fabricCanvas, author, {
            left: fabricCanvas.width / 2,
            top: fabricCanvas.height - 80,
            fontSize: 24,
            fontFamily: 'Inter',
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
          });
          fabricCanvas.add(authorText);
        }

        fabricCanvas.renderAll();
      } catch (error) {
        console.error('Error loading initial content:', error);
      }
    },
    [coverColor, initialImage, title, author]
  );

  // Guardar diseño a nivel de sesión
  const handleSaveDesign = useCallback(() => {
    if (!canvas) return;

    try {
      const designData = {
        canvasJson: canvas.toJSON(),
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem('advancedCoverDesign', JSON.stringify(designData));
      alert('Diseño guardado en la sesión');
    } catch (error) {
      console.error('Error saving design:', error);
    }
  }, [canvas]);

  const handleSave = useCallback(() => {
    if (!canvas) return;

    try {
      // Guardar diseño en sesión
      handleSaveDesign();

      // Exportar como imagen
      const imageData = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      onSave?.(imageData);
      
      // Limpiar y cerrar
      clear();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving cover:', error);
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
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="sm"
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
        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex-shrink-0">
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
