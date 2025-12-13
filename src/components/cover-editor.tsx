"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  author: string;
  coverColor: string;
  coverImage: string | null;
  onCoverChange: (coverImage: string | null) => void;
  onColorChange: (coverColor: string) => void;
}

const colorPresets = [
  { name: "Arena Editorial", color: "#D6BFA2" },
  { name: "Turquesa Vivo", color: "#00B4A0" },
  { name: "Azul Profundo", color: "#00253F" },
  { name: "Teal Oscuro", color: "#005872" },
  { name: "Menta Fresca", color: "#80ED99" },
  { name: "Teal Medio", color: "#14919B" },
  { name: "Cian Claro", color: "#0AD1C8" },
  { name: "Gris Clásico", color: "#6B7280" },
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
  {
    name: "Libre Baskerville",
    class: "font-serif",
    description: "Clásico y elegante",
  },
  { name: "Inter", class: "font-sans", description: "Moderno y limpio" },
  {
    name: "JetBrains Mono",
    class: "font-mono",
    description: "Técnico y minimalista",
  },
];

export default function CoverEditor({
  title,
  author,
  coverColor,
  coverImage,
  onCoverChange,
  onColorChange,
}: CoverEditorProps) {
  const { t, mounted, language } = useLanguage();
  const [selectedLayout, setSelectedLayout] = useState("centered");
  const [selectedFont, setSelectedFont] = useState("font-serif");
  const [uploadedImage, setUploadedImage] = useState<string | null>(coverImage);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        onCoverChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (color: string) => {
    onColorChange(color);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const mockGeneratedImage = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${coverColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:#00253F;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="600" fill="url(#grad)"/>
          <text x="200" y="250" font-family="Libre Baskerville" font-size="32" fill="white" text-anchor="middle">${
            title || (mounted && language === 'es' ? 'Tu Título' : 'Your Title')
          }</text>
          <text x="200" y="350" font-family="Inter" font-size="18" fill="white" text-anchor="middle">${
            author || (mounted && language === 'es' ? 'Tu Nombre' : 'Your Name')
          }</text>
        </svg>
      `)}`;
      setUploadedImage(mockGeneratedImage);
      onCoverChange(mockGeneratedImage);
      setIsGenerating(false);
    }, 2000);
  };

  const canProceed = () => {
    return title.length > 0 && author.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif">{mounted && t('cover.title')}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {mounted && t('cover.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cover Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{mounted ? (language === 'es' ? 'Vista Previa' : 'Preview') : 'Preview'}</h3>
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
                    {mounted ? (language === 'es' ? 'Generando...' : 'Generating...') : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {mounted ? (language === 'es' ? 'Generar con IA' : 'Generate with AI') : 'Generate'}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {mounted ? (language === 'es' ? 'Exportar' : 'Export') : 'Export'}
              </Button>
            </div>
          </div>

          <Card className="surface-1 overflow-hidden">
            <CardContent className="p-6">
              <div className="aspect-2/3 max-w-sm mx-auto relative overflow-hidden rounded-lg shadow-lg">
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
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
                  <div className={`space-y-4 ${selectedFont}`}>
                    <h1 className="text-3xl font-bold leading-tight drop-shadow-lg">
                      {title || (mounted && language === 'es' ? "Tu Título Aquí" : "Your Title Here")}
                    </h1>
                    <p className="text-lg opacity-90 drop-shadow-md">
                      {author || (mounted && language === 'es' ? "Tu Nombre" : "Your Name")}
                    </p>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Book Info */}
          <Card className="surface-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{mounted ? (language === 'es' ? 'Título:' : 'Title:') : 'Title:'}</span>
                  <span className="text-sm font-medium">
                    {title || (mounted && language === 'es' ? 'Sin título' : 'Untitled')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{mounted ? (language === 'es' ? 'Autor:' : 'Author:') : 'Author:'}</span>
                  <span className="text-sm font-medium">
                    {author || (mounted && language === 'es' ? 'Sin autor' : 'Unknown')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{mounted ? (language === 'es' ? 'Color:' : 'Color:') : 'Color:'}</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: coverColor }}
                    />
                    <span className="text-sm font-medium">{coverColor}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <Tabs defaultValue="color" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="color">{mounted ? (language === 'es' ? 'Color' : 'Color') : 'Color'}</TabsTrigger>
              <TabsTrigger value="image">{mounted ? (language === 'es' ? 'Imagen' : 'Image') : 'Image'}</TabsTrigger>
              <TabsTrigger value="typography">{mounted ? (language === 'es' ? 'Tipografía' : 'Typography') : 'Type'}</TabsTrigger>
            </TabsList>

            <TabsContent value="color" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    {mounted ? (language === 'es' ? 'Color de Fondo' : 'Background Color') : 'Color'}
                  </CardTitle>
                  <CardDescription>
                    {mounted ? (language === 'es' ? 'Elige un color que represente el tono de tu libro' : 'Choose a color that represents the tone of your book') : 'Choose color'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Presets */}
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => handleColorSelect(preset.color)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          coverColor === preset.color
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {coverColor === preset.color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-primary rounded-full" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-color">{mounted ? (language === 'es' ? 'Color Personalizado' : 'Custom Color') : 'Color'}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="custom-color"
                        type="color"
                        value={coverColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={coverColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    {mounted ? (language === 'es' ? 'Imagen de Fondo' : 'Background Image') : 'Image'}
                  </CardTitle>
                  <CardDescription>
                    {mounted ? (language === 'es' ? 'Añade una imagen para hacer tu portada más visual' : 'Add an image to make your cover more visual') : 'Add image'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{mounted ? (language === 'es' ? 'Subir imagen' : 'Upload image') : 'Upload'}</p>
                      <p className="text-xs text-muted-foreground">
                        {mounted ? (language === 'es' ? 'PNG, JPG hasta 10MB. Recomendado 800x1200px' : 'PNG, JPG up to 10MB. Recommended 800x1200px') : 'PNG, JPG up to 10MB'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {mounted ? (language === 'es' ? 'Seleccionar Archivo' : 'Select File') : 'Select'}
                    </Button>
                  </div>

                  {/* Current Image */}
                  {uploadedImage && (
                    <div className="space-y-2">
                      <Label>{mounted ? (language === 'es' ? 'Imagen Actual' : 'Current Image') : 'Image'}</Label>
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Current uploaded cover image"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setUploadedImage(null);
                            onCoverChange(null);
                          }}
                        >
                          {mounted ? (language === 'es' ? 'Eliminar' : 'Remove') : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    {mounted ? (language === 'es' ? 'Tipografía' : 'Typography') : 'Type'}
                  </CardTitle>
                  <CardDescription>
                    {mounted ? (language === 'es' ? 'Elige la fuente perfecta para tu portada' : 'Choose the perfect font for your cover') : 'Choose font'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Font Selection */}
                  <div className="space-y-3">
                    {fontStyles.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => setSelectedFont(font.class)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedFont === font.class
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`${font.class} space-y-1`}>
                          <h4 className="font-semibold">{font.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {font.description}
                          </p>
                          <p className="text-lg">Ejemplo de Texto</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Layout Options */}
          <Card className="surface-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="w-5 h-5" />
                {mounted ? (language === 'es' ? 'Diseño' : 'Layout') : 'Layout'}
              </CardTitle>
              <CardDescription>
                {mounted ? (language === 'es' ? 'Organiza los elementos en tu portada' : 'Organize the elements on your cover') : 'Organize elements'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {layoutStyles.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedLayout === layout.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="aspect-3/4 bg-muted rounded mb-2 flex items-center justify-center">
                      <Layout className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-sm">{layout.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {layout.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Message */}
      {!canProceed() && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <Type className="w-4 h-4" />
              <span className="text-sm">
                {mounted && t('cover.minimumContent')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
