"use client";

import { useState } from "react";
import {
  Book,
  Type,
  Palette,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Upload,
  Eye,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface BackCoverEditorProps {
  title: string;
  author: string;
  publisher?: string;
  isbn?: string;
  publicationDate?: string;
  description?: string;
  reviews?: string[];
  coverColor: string;
  coverImage: string | null;
  onBackCoverChange: (backCoverData: any) => void;
  onColorChange: (coverColor: string) => void;
  onImageChange: (coverImage: string | null) => void;
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
    description: "Contenido centrado verticalmente",
  },
  {
    id: "top",
    name: "Superior",
    description: "Contenido en la parte superior",
  },
  {
    id: "bottom",
    name: "Inferior",
    description: "Contenido en la parte inferior",
  },
  {
    id: "split",
    name: "Dividido",
    description: "Descripción arriba, reseñas abajo",
  },
];

export default function BackCoverEditor({
  title,
  author,
  publisher = "",
  isbn = "",
  publicationDate = "",
  description = "",
  reviews = [],
  coverColor,
  coverImage,
  onBackCoverChange,
  onColorChange,
  onImageChange,
}: BackCoverEditorProps) {
  const [selectedLayout, setSelectedLayout] = useState("centered");
  const [backCoverData, setBackCoverData] = useState({
    title,
    author,
    publisher,
    isbn,
    publicationDate,
    description,
    reviews,
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (color: string) => {
    onColorChange(color);
  };

  const handleDataChange = (field: string, value: string | string[]) => {
    const newData = { ...backCoverData, [field]: value };
    setBackCoverData(newData);
    onBackCoverChange(newData);
  };

  const addReview = () => {
    const newReview = {
      id: `review-${Date.now()}`,
      text: "",
      author: "",
      source: "",
    };
    handleDataChange("reviews", [...reviews, newReview]);
  };

  const updateReview = (index: number, field: string, value: string) => {
    const updatedReviews = [...reviews];
    updatedReviews[index] = { ...updatedReviews[index], [field]: value };
    handleDataChange("reviews", updatedReviews);
  };

  const removeReview = (index: number) => {
    const updatedReviews = reviews.filter((_, i) => i !== index);
    handleDataChange("reviews", updatedReviews);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif">
          Diseña tu Contraportada
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Crea una contraportada profesional con información del libro, reseñas
          y elementos de diseño que complementen tu portada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Back Cover Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vista Previa</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>

          <Card className="surface-1 overflow-hidden">
            <CardContent className="p-6">
              <div className="aspect-3/4 max-w-sm mx-auto relative overflow-hidden rounded-lg shadow-lg">
                {/* Background */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: coverColor }}
                >
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Back cover background preview"
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  {/* Top Section */}
                  <div className="space-y-4">
                    <h1 className="text-xl font-bold font-serif leading-tight">
                      {backCoverData.title || "Tu Título"}
                    </h1>
                    <p className="text-sm opacity-90">{backCoverData.author}</p>

                    {backCoverData.description && (
                      <p className="text-xs leading-relaxed opacity-80 line-clamp-4">
                        {backCoverData.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Section */}
                  <div className="space-y-3">
                    {backCoverData.publisher && (
                      <div>
                        <p className="text-xs font-medium">Editorial</p>
                        <p className="text-sm opacity-90">
                          {backCoverData.publisher}
                        </p>
                      </div>
                    )}

                    {backCoverData.isbn && (
                      <div>
                        <p className="text-xs font-medium">ISBN</p>
                        <p className="text-sm opacity-90">
                          {backCoverData.isbn}
                        </p>
                      </div>
                    )}

                    {backCoverData.reviews &&
                      backCoverData.reviews.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Reseñas</p>
                          <div className="space-y-2">
                            {backCoverData.reviews
                              .slice(0, 2)
                              .map((review, index) => (
                                <div key={index} className="text-xs">
                                  <p className="font-medium opacity-90">
                                    {review.author}
                                  </p>
                                  <p className="opacity-80 line-clamp-2">
                                    "{review.text}"
                                  </p>
                                  {review.source && (
                                    <p className="opacity-70">
                                      — {review.source}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book Info */}
          <Card className="surface-2">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Título:</span>
                  <span className="text-sm font-medium">
                    {backCoverData.title || "Sin título"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Autor:</span>
                  <span className="text-sm font-medium">
                    {backCoverData.author || "Sin autor"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Editorial:
                  </span>
                  <span className="text-sm font-medium">
                    {backCoverData.publisher || "Sin editorial"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ISBN:</span>
                  <span className="text-sm font-medium">
                    {backCoverData.isbn || "Sin ISBN"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="design">Diseño</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Información del Libro
                  </CardTitle>
                  <CardDescription>
                    Añade los detalles que aparecerán en la contraportada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="publisher">Editorial</Label>
                      <Input
                        id="publisher"
                        value={backCoverData.publisher}
                        onChange={(e) =>
                          handleDataChange("publisher", e.target.value)
                        }
                        placeholder="Nombre de la editorial"
                        className="surface-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={backCoverData.isbn}
                        onChange={(e) =>
                          handleDataChange("isbn", e.target.value)
                        }
                        placeholder="978-3-16-148410-0"
                        className="surface-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={backCoverData.description}
                      onChange={(e) =>
                        handleDataChange("description", e.target.value)
                      }
                      placeholder="Breve descripción del libro para la contraportada..."
                      className="min-h-[100px] resize-none surface-1"
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground">
                      {backCoverData.description.length}/300 caracteres
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publication-date">
                      Fecha de Publicación
                    </Label>
                    <Input
                      id="publication-date"
                      type="date"
                      value={backCoverData.publicationDate}
                      onChange={(e) =>
                        handleDataChange("publicationDate", e.target.value)
                      }
                      className="surface-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card className="surface-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Reseñas</CardTitle>
                      <CardDescription>
                        Añade reseñas críticas para dar credibilidad
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={addReview}>
                      Añadir Reseña
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay reseñas añadidas</p>
                      <p className="text-sm">
                        Añade reseñas críticas para mejorar la presentación
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review, index) => (
                        <div
                          key={review.id}
                          className="p-4 border rounded-lg surface-1"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="space-y-2">
                              <Label htmlFor={`review-author-${index}`}>
                                Autor de la reseña
                              </Label>
                              <Input
                                id={`review-author-${index}`}
                                value={review.author}
                                onChange={(e) =>
                                  updateReview(index, "author", e.target.value)
                                }
                                placeholder="Nombre del crítico"
                                className="surface-1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`review-source-${index}`}>
                                Fuente
                              </Label>
                              <Input
                                id={`review-source-${index}`}
                                value={review.source}
                                onChange={(e) =>
                                  updateReview(index, "source", e.target.value)
                                }
                                placeholder="Periódico, revista, etc."
                                className="surface-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`review-text-${index}`}>
                              Texto de la reseña
                            </Label>
                            <Textarea
                              id={`review-text-${index}`}
                              value={review.text}
                              onChange={(e) =>
                                updateReview(index, "text", e.target.value)
                              }
                              placeholder="Texto completo de la reseña..."
                              className="min-h-20 resize-none surface-1"
                              maxLength={200}
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {review.text.length}/200 caracteres
                              </p>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeReview(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color de Fondo
                  </CardTitle>
                  <CardDescription>
                    Elige un color que complemente la portada frontal
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
                        title={preset.name}
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
                    <Label htmlFor="custom-color">Color Personalizado</Label>
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

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="back-cover-image">Imagen de Fondo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="back-cover-image"
                      />
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Subir imagen de fondo</p>
                          <p className="text-sm text-muted-foreground">
                            PNG, JPG hasta 10MB. Recomendado 800x1200px
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("back-cover-image")?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Archivo
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Book className="w-5 h-5" />
                    Diseño de Contraportada
                  </CardTitle>
                  <CardDescription>
                    Organiza los elementos en tu contraportada
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
                          <Book className="w-8 h-8 text-muted-foreground" />
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
