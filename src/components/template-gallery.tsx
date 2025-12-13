"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  Palette,
  Book,
  FileText,
  Star,
  Heart,
  Plus,
  Eye,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  features: string[];
  isCustom?: boolean;
  isPremium?: boolean;
}

interface TemplateGalleryProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  userTemplates: Template[];
  onSaveTemplate: (template: Template) => void;
}

const defaultTemplates: Template[] = [
  {
    id: "modern",
    name: "Moderno",
    description:
      "Diseño limpio y minimalista perfecto para libros técnicos y de negocios",
    category: "profesional",
    preview: "/templates/modern-preview.png",
    features: [
      "Tipografía clara",
      "Espaciado generoso",
      "Navegación intuitiva",
    ],
  },
  {
    id: "classic",
    name: "Clásico",
    description: "Estilo atemporal ideal para novelas y literatura",
    category: "literatura",
    preview: "/templates/classic-preview.png",
    features: [
      "Tipografía serif",
      "Diseño tradicional",
      "Formato de libro impreso",
    ],
  },
  {
    id: "creative",
    name: "Creativo",
    description: "Diseño audaz para libros de arte y fotografía",
    category: "creativo",
    preview: "/templates/creative-preview.png",
    features: ["Diseño dinámico", "Colores vibrantes", "Layout flexible"],
  },
  {
    id: "academic",
    name: "Académico",
    description: "Formato riguroso para tesis y papers académicos",
    category: "académico",
    preview: "/templates/academic-preview.png",
    features: ["Citas automáticas", "Índice", "Bibliografía", "Notas al pie"],
  },
  {
    id: "magazine",
    name: "Revista",
    description: "Estilo de revista para publicaciones periódicas",
    category: "editorial",
    preview: "/templates/magazine-preview.png",
    features: ["Columnas", "Imágenes destacadas", "Tipografía variada"],
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Diseño ultra-simple para máxima legibilidad",
    category: "minimalista",
    preview: "/templates/minimal-preview.png",
    features: ["Sin distracciones", "Texto grande", "Alto contraste"],
  },
];

const categories = [
  { id: "all", name: "Todas", icon: Book },
  { id: "profesional", name: "Profesional", icon: FileText },
  { id: "literatura", name: "Literatura", icon: Book },
  { id: "creativo", name: "Creativo", icon: Palette },
  { id: "académico", name: "Académico", icon: FileText },
  { id: "editorial", name: "Editorial", icon: Book },
  { id: "minimalista", name: "Minimalista", icon: Settings },
];

export default function TemplateGallery({
  selectedTemplate,
  onTemplateSelect,
  userTemplates,
  onSaveTemplate,
}: TemplateGalleryProps) {
  const { t, mounted, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const allTemplates = [...defaultTemplates, ...userTemplates];
  const filteredTemplates =
    activeCategory === "all"
      ? allTemplates
      : allTemplates.filter((template) => template.category === activeCategory);

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template.id);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleSaveAsCustom = (template: Template) => {
    const customLabel =
      mounted && language === "es" ? "(Personalizada)" : "(Custom)";
    const customTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} ${customLabel}`,
      isCustom: true,
    };
    onSaveTemplate(customTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif">
          {mounted && t("template.title")}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {mounted && t("template.subtitle")}
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs"
            >
              <category.icon className="w-4 h-4 mr-1" />
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`surface-1 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedTemplate === template.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        {template.name}
                        {template.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            {mounted
                              ? language === "es"
                                ? "Personalizada"
                                : "Custom"
                              : "Custom"}
                          </Badge>
                        )}
                        {template.isPremium && (
                          <Badge
                            variant="default"
                            className="text-xs bg-linear-to-r from-amber-500 to-amber-600"
                          >
                            Premium
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
                      {selectedTemplate === template.id && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Image */}
                  <div className="aspect-3/4 bg-muted rounded-lg overflow-hidden relative group">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Book className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(template);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {mounted
                          ? language === "es"
                            ? "Vista Previa"
                            : "Preview"
                          : "Preview"}
                      </Button>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      {mounted
                        ? language === "es"
                          ? "Características:"
                          : "Features:"
                        : "Features:"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(template);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {mounted
                          ? language === "es"
                            ? "Vista"
                            : "View"
                          : "View"}
                      </Button>
                      {!template.isCustom && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveAsCustom(template);
                          }}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {mounted
                            ? language === "es"
                              ? "Guardar"
                              : "Save"
                            : "Save"}
                        </Button>
                      )}
                    </div>
                    {selectedTemplate === template.id && (
                      <Badge variant="default" className="text-xs">
                        {mounted
                          ? language === "es"
                            ? "Seleccionada"
                            : "Selected"
                          : "Selected"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Template Creation */}
      {userTemplates.length === 0 && (
        <Card className="surface-3 border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {mounted
                ? language === "es"
                  ? "Crea tu Propia Plantilla"
                  : "Create Your Own Template"
                : "Create Template"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {mounted
                ? language === "es"
                  ? "Personaliza una plantilla existente o crea una desde cero"
                  : "Customize an existing template or create one from scratch"
                : "Create or customize"}
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              {mounted
                ? language === "es"
                  ? "Crear Plantilla Personalizada"
                  : "Create Custom Template"
                : "Create"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Stats */}
      <Card className="surface-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">
                {defaultTemplates.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Plantillas Base"
                    : "Base Templates"
                  : "Base"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-accent">
                {userTemplates.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Personalizadas"
                    : "Custom"
                  : "Custom"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-secondary">
                {categories.length - 1}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Categorías"
                    : "Categories"
                  : "Categories"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Posibilidades"
                    : "Possibilities"
                  : "Possibilities"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal Placeholder */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-serif">
                    {previewTemplate.name}
                  </CardTitle>
                  <CardDescription>
                    {previewTemplate.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-3/4 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Book className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {mounted
                      ? language === "es"
                        ? "Vista previa de la plantilla"
                        : "Template preview"
                      : "Preview"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {mounted
                      ? language === "es"
                        ? "Características:"
                        : "Features:"
                      : "Features:"}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleTemplateSelect(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                  >
                    {mounted
                      ? language === "es"
                        ? "Seleccionar Plantilla"
                        : "Select Template"
                      : "Select"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
