"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  Image as ImageIcon,
  Upload,
  Palette,
  Type,
  Layout,
  Sparkles,
  Download,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdvancedCoverEditor from "@/components/advanced-cover-editor/AdvancedCoverEditor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CoverEditorProps {
  title: string;
  subtitle?: string;
  author: string;
  coverColor: string;
  coverImage: string | null;
  coverLayout?: string;
  coverFont?: string;
  onCoverChange: (coverImage: string | null) => void;
  onColorChange: (coverColor: string) => void;
  onLayoutChange?: (coverLayout: string) => void;
  onFontChange?: (coverFont: string) => void;
}

const colorPresets = [
  // Paleta Náutica Elegante (Nueva)
  { name: "Navy Elegante", color: "#083A4F" },
  { name: "Gold Sofisticado", color: "#A8BD66" },
  { name: "Aqua Fresco", color: "#C0D5D6" },
  { name: "Teal Equilibrado", color: "#407E8C" },
  { name: "Arena Natural", color: "#E5E1DD" },

  // Colores Cálidos
  { name: "Arena Editorial", color: "#D6BFA2" },
  { name: "Terracota Cálida", color: "#C85A54" },
  { name: "Marrón Chocolate", color: "#6B4423" },
  { name: "Oro Antiguo", color: "#B8860B" },
  { name: "Salmón Suave", color: "#F08080" },

  // Colores Fríos
  { name: "Turquesa Vivo", color: "#00B4A0" },
  { name: "Azul Profundo", color: "#00253F" },
  { name: "Teal Oscuro", color: "#005872" },
  { name: "Menta Fresca", color: "#80ED99" },
  { name: "Cian Claro", color: "#0AD1C8" },

  // Colores Neutros
  { name: "Gris Clásico", color: "#6B7280" },
  { name: "Gris Oscuro", color: "#374151" },
  { name: "Blanco Roto", color: "#F5F5F0" },
  { name: "Negro Profundo", color: "#1F2937" },

  // Colores Vibrantes
  { name: "Púrpura Profundo", color: "#6B21A8" },
  { name: "Índigo Elegante", color: "#4F46E5" },
  { name: "Rosa Vibrante", color: "#EC4899" },
  { name: "Rojo Vino", color: "#991B1B" },
  { name: "Verde Bosque", color: "#15803D" },
  { name: "Naranja Cálido", color: "#EA580C" },
];

const layoutStyles = [
  {
    id: "centered",
    name: "Centrado",
    description: "Título y autor centrados verticalmente",
    preview: "/layouts/centered.png",
  },
  {
    id: "top",
    name: "Superior",
    description: "Título en la parte superior",
    preview: "/layouts/top.png",
  },
  {
    id: "bottom",
    name: "Inferior",
    description: "Título en la parte inferior",
    preview: "/layouts/bottom.png",
  },
  {
    id: "split",
    name: "Dividido",
    description: "Título arriba, autor abajo",
    preview: "/layouts/split.png",
  },
];

const fontStyles = [
  // Serif Clásicos
  {
    name: "Libre Baskerville",
    class: "font-serif",
    description: "Clásico y elegante",
  },
  {
    name: "Playfair Display",
    class: "font-playfair",
    description: "Sofisticado y moderno",
  },
  {
    name: "Merriweather",
    class: "font-merriweather",
    description: "Legible y tradicional",
  },
  // Sans Serif Modernos
  {
    name: "Inter",
    class: "font-sans",
    description: "Limpio y contemporáneo",
  },
  {
    name: "Montserrat",
    class: "font-montserrat",
    description: "Geométrico y audaz",
  },
  {
    name: "Open Sans",
    class: "font-opensans",
    description: "Versátil y amigable",
  },
];

export default function CoverEditor({
  title,
  subtitle,
  author,
  coverColor,
  coverImage,
  coverLayout = "centered",
  coverFont = "font-serif",
  onCoverChange,
  onColorChange,
  onLayoutChange,
  onFontChange,
}: CoverEditorProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(coverImage);
  const [selectedFont, setSelectedFont] = useState(coverFont);
  const [selectedLayout, setSelectedLayout] = useState(coverLayout);

  // ═══════════════════════════════════════════════════════════════════════════
  // REF PARA CAPTURA DE PORTADA - NUEVO
  // ═══════════════════════════════════════════════════════════════════════════
  const coverPreviewRef = useRef<HTMLDivElement>(null);
  const [capturedCoverImage, setCapturedCoverImage] = useState<string | null>(
    null
  );
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setUploadedImage(coverImage);
  }, [coverImage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIÓN PARA CAPTURAR LA PORTADA COMO IMAGEN - NUEVO
  // ═══════════════════════════════════════════════════════════════════════════
  const captureCoverAsImage = useCallback(async (): Promise<string | null> => {
    if (!coverPreviewRef.current) return null;

    setIsCapturing(true);

    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(coverPreviewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: coverColor, // Usar el color de fondo como fallback
        logging: false,
        ignoreElements: (element) => {
          // Ignorar elementos que puedan causar problemas
          return element.classList?.contains("backdrop-blur-sm");
        },
        onclone: (clonedDoc) => {
          // Convertir oklch a rgb en el clon antes de capturar
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el as Element);
            const bgColor = style.backgroundColor;
            const textColor = style.color;

            // Si tiene oklch, reemplazar con color sólido
            if (bgColor.includes("oklch")) {
              (el as HTMLElement).style.backgroundColor = coverColor;
            }
            if (textColor.includes("oklch")) {
              (el as HTMLElement).style.color = "#ffffff";
            }
          });
        },
      } as any);

      const imageData = canvas.toDataURL("image/png", 1.0);
      setCapturedCoverImage(imageData);
      return imageData;
    } catch (error) {
      console.error("Error capturing cover:", error);
      return uploadedImage;
    } finally {
      setIsCapturing(false);
    }
  }, [uploadedImage, coverColor]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTURAR PORTADA ANTES DE ABRIR EDITOR AVANZADO - NUEVO
  // ═══════════════════════════════════════════════════════════════════════════
  const handleOpenAdvancedEditor = useCallback(async () => {
    const captured = await captureCoverAsImage();
    // El AdvancedCoverEditor se abrirá con la imagen capturada
    return captured;
  }, [captureCoverAsImage]);

  const getLayoutConfig = (layoutId: string) => {
    switch (layoutId) {
      case "top":
        return {
          container: "justify-start pt-12",
          content: "items-center gap-4",
          title: "text-center",
          author: "mt-auto mb-4 text-center",
        };
      case "bottom":
        return {
          container: "justify-end pb-12",
          content: "items-center gap-4",
          title: "text-center",
          author: "mt-2 text-center",
        };
      case "split":
        return {
          container: "justify-between py-12",
          content: "items-center",
          title: "text-center",
          author: "text-center",
        };
      case "centered":
      default:
        return {
          container: "justify-center",
          content: "items-center gap-4",
          title: "text-center",
          author: "mt-2 text-center",
        };
    }
  };

  const layoutConfig = getLayoutConfig(selectedLayout);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result as string;
        setUploadedImage(result);
        onCoverChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFontChange = (fontClass: string) => {
    setSelectedFont(fontClass);
    onFontChange?.(fontClass);
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayout(layoutId);
    onLayoutChange?.(layoutId);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {mounted
              ? language === "es"
                ? "Vista Previa"
                : "Preview"
              : "Preview"}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                {mounted
                  ? language === "es"
                    ? "Generando..."
                    : "Generating..."
                  : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {mounted
                  ? language === "es"
                    ? "Generar con IA"
                    : "Generate with AI"
                  : "Generate"}
              </>
            )}
          </Button>

          {/* ═══════════════════════════════════════════════════════════════
              EDITOR AVANZADO - MODIFICADO PARA USAR IMAGEN CAPTURADA
              ═══════════════════════════════════════════════════════════════ */}
          <AdvancedCoverEditor
            initialImage={capturedCoverImage || uploadedImage || undefined}
            title={title}
            subtitle={subtitle}
            author={author}
            coverColor={coverColor}
            coverLayout={selectedLayout}
            coverFont={selectedFont}
            onBeforeOpen={handleOpenAdvancedEditor}
            onSave={(imageData: string) => {
              setUploadedImage(imageData);
              onCoverChange(imageData);
            }}
          />

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {mounted ? (language === "es" ? "Exportar" : "Export") : "Export"}
          </Button>
        </div>
      </div>

      {/* Cover Preview Card */}
      <Card className="surface-1 overflow-hidden">
        <CardContent className="p-6">
          {/* ═══════════════════════════════════════════════════════════════
              CONTENEDOR DE PORTADA CON REF PARA CAPTURA
              ═══════════════════════════════════════════════════════════════ */}
          <div
            ref={coverPreviewRef}
            className="aspect-2/3 max-w-sm mx-auto relative overflow-hidden rounded-lg shadow-lg"
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: coverColor }}
            >
              {uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Cover background preview"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
            </div>

            {/* Content Overlay */}
            <div
              className={`absolute inset-0 flex flex-col text-white p-8 transition-all ${layoutConfig.container}`}
            >
              <div
                className={`flex flex-col w-full ${selectedFont} ${layoutConfig.content}`}
              >
                <h1
                  className={`text-3xl font-bold leading-tight drop-shadow-lg ${layoutConfig.title}`}
                >
                  {title ||
                    (mounted && language === "es"
                      ? "Tu Título Aquí"
                      : "Your Title Here")}
                </h1>
                {subtitle && (
                  <p
                    className={`text-base italic opacity-80 drop-shadow-md mt-2 ${layoutConfig.title}`}
                  >
                    {subtitle}
                  </p>
                )}
                <p
                  className={`text-lg opacity-90 drop-shadow-md ${layoutConfig.author}`}
                >
                  {author ||
                    (mounted && language === "es" ? "Tu Nombre" : "Your Name")}
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm" />

            {/* Indicador de captura */}
            {isCapturing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Card className="surface-2">
        <CardContent className="p-4">
          <Tabs defaultValue="color" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="color" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {mounted ? (language === "es" ? "Color" : "Color") : "Color"}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {mounted ? (language === "es" ? "Imagen" : "Image") : "Image"}
              </TabsTrigger>
              <TabsTrigger
                value="typography"
                className="flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                {mounted
                  ? language === "es"
                    ? "Tipografía"
                    : "Typography"
                  : "Typography"}
              </TabsTrigger>
            </TabsList>

            {/* Color Tab */}
            <TabsContent value="color" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {mounted
                    ? language === "es"
                      ? "Selecciona un color"
                      : "Select a color"
                    : "Select a color"}
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => onColorChange(preset.color)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                        coverColor === preset.color
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {mounted
                    ? language === "es"
                      ? "Color personalizado"
                      : "Custom color"
                    : "Custom color"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={coverColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={coverColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {mounted
                    ? language === "es"
                      ? "Imagen de fondo"
                      : "Background image"
                    : "Background image"}
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="cover-image-upload"
                  />
                  <label
                    htmlFor="cover-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {mounted
                        ? language === "es"
                          ? "Arrastra una imagen o haz clic para subir"
                          : "Drag an image or click to upload"
                        : "Upload image"}
                    </span>
                  </label>
                </div>
                {uploadedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadedImage(null);
                      onCoverChange(null);
                    }}
                    className="mt-2"
                  >
                    {mounted
                      ? language === "es"
                        ? "Eliminar imagen"
                        : "Remove image"
                      : "Remove"}
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {mounted
                    ? language === "es"
                      ? "Selecciona una tipografía"
                      : "Select a font"
                    : "Select a font"}
                </Label>
                <Select value={selectedFont} onValueChange={handleFontChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontStyles.map((font) => (
                      <SelectItem key={font.class} value={font.class}>
                        <div className="flex flex-col">
                          <span className={font.class}>{font.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {font.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Preview */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">
                  {mounted
                    ? language === "es"
                      ? "Vista previa"
                      : "Preview"
                    : "Preview"}
                </p>
                <div className={selectedFont}>
                  <p className="text-xl font-bold">
                    {mounted
                      ? language === "es"
                        ? "Título de tu Portada"
                        : "Your Cover Title"
                      : "Title"}
                  </p>
                  <p className="text-sm">
                    {mounted
                      ? language === "es"
                        ? "Autor del Libro"
                        : "Book Author"
                      : "Author"}
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    {mounted
                      ? language === "es"
                        ? "Ejemplo de texto con la tipografía seleccionada"
                        : "Sample text with selected typography"
                      : "Sample text"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Layout Section */}
      <Card className="surface-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-4 h-4" />
            {mounted ? (language === "es" ? "Diseño" : "Layout") : "Layout"}
          </CardTitle>
          <CardDescription>
            {mounted
              ? language === "es"
                ? "Organiza los elementos en tu portada"
                : "Organize elements on your cover"
              : "Organize elements"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {layoutStyles.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleLayoutChange(layout.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedLayout === layout.id
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className="aspect-3/4 bg-muted rounded mb-2 flex items-center justify-center">
                  <Layout className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">{layout.name}</p>
                <p className="text-xs text-muted-foreground">
                  {layout.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
