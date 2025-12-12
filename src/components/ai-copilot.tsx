"use client"

import { useState } from "react"
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Check, 
  X, 
  Lightbulb,
  Edit3,
  Palette,
  FileText,
  Image,
  BookOpen,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BookData {
  title: string
  subtitle: string
  author: string
  content: string
  template: string
  coverImage: string | null
  coverColor: string
  genre: string
}

interface AICopilotProps {
  content: string
  onSuggestion: (suggestion: any) => void
  bookData: BookData
  onUpdateBookData: (updates: Partial<BookData>) => void
}

interface AISuggestion {
  id: string
  type: "text-improvement" | "style-suggestion" | "cover-idea" | "title-suggestion" | "content-expansion"
  title: string
  description: string
  content: string
  icon: React.ElementType
  applied: boolean
  feedback?: "positive" | "negative"
}

const aiTools = [
  {
    id: "improve-writing",
    name: "Mejorar Escritura",
    description: "Sugerencias para mejorar la claridad y estilo",
    icon: Edit3,
    type: "text-improvement"
  },
  {
    id: "style-suggestions",
    name: "Estilo y Tono",
    description: "Ajusta el tono y estilo de tu contenido",
    icon: Palette,
    type: "style-suggestion"
  },
  {
    id: "generate-cover",
    name: "Generar Portada",
    description: "Crea una portada con IA",
    icon: Image,
    type: "cover-idea"
  },
  {
    id: "title-ideas",
    name: "Ideas de Título",
    description: "Sugerencias para títulos atractivos",
    icon: BookOpen,
    type: "title-suggestion"
  },
  {
    id: "expand-content",
    name: "Expandir Contenido",
    description: "Añade más detalles y profundidad",
    icon: FileText,
    type: "content-expansion"
  }
]

export default function AICopilot({ 
  content, 
  onSuggestion, 
  bookData, 
  onUpdateBookData 
}: AICopilotProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedText, setSelectedText] = useState("")

  const generateSuggestion = async (toolType: string) => {
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      const newSuggestion: AISuggestion = {
        id: `suggestion-${Date.now()}`,
        type: toolType as AISuggestion['type'],
        title: generateSuggestionTitle(toolType),
        description: generateSuggestionDescription(toolType),
        content: generateSuggestionContent(toolType),
        icon: getIconForType(toolType),
        applied: false
      }
      
      setSuggestions(prev => [newSuggestion, ...prev])
      setIsGenerating(false)
    }, 2000)
  }

  const generateSuggestionTitle = (type: string): string => {
    switch (type) {
      case "text-improvement":
        return "Mejorar Claridad del Texto"
      case "style-suggestion":
        return "Ajustar Tono a Más Profesional"
      case "cover-idea":
        return "Portada Minimalista Moderna"
      case "title-suggestion":
        return "Títulos Alternativos"
      case "content-expansion":
        return "Expandir Introducción"
      default:
        return "Sugerencia de IA"
    }
  }

  const generateSuggestionDescription = (type: string): string => {
    switch (type) {
      case "text-improvement":
        return "He detectado algunas frases que podrían ser más claras y concisas."
      case "style-suggestion":
        return "Ajusta el tono para que sea más formal y profesional."
      case "cover-idea":
        return "Basado en tu contenido, te sugiero una portada con elementos minimalistas."
      case "title-suggestion":
        return "Aquí tienes algunas alternativas de título más atractivas."
      case "content-expansion":
        return "Podrías añadir más contexto en la introducción."
      default:
        return "Sugerencia generada por IA"
    }
  }

  const generateSuggestionContent = (type: string): string => {
    switch (type) {
      case "text-improvement":
        return "Sugiero reemplazar 'En este sentido' por 'Por lo tanto' para mayor claridad. También podrías simplificar la estructura de algunas frases largas."
      case "style-suggestion":
        return "Considera usar un lenguaje más formal. Reemplaza expresiones coloquiales por alternativas profesionales. Mantén un tono consistente throughout."
      case "cover-idea":
        return "Te sugiero una portada con fondo de color arena (#D6BFA2), tipografía serif para el título y un elemento gráfico sutil que represente el tema principal."
      case "title-suggestion":
        return "1. 'El Arte de la Productividad'\n2. 'Anclado al Éxito'\n3. 'Navegando el Caos Digital'\n4. 'Tu Brújula Profesional'"
      case "content-expansion":
        return "Podrías añadir estadísticas recientes sobre el tema, incluir ejemplos prácticos, y desarrollar más los antecedentes para dar más contexto a tus lectores."
      default:
        return "Contenido de la sugerencia generada por IA"
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "text-improvement":
        return Edit3
      case "style-suggestion":
        return Palette
      case "cover-idea":
        return Image
      case "title-suggestion":
        return BookOpen
      case "content-expansion":
        return FileText
      default:
        return Lightbulb
    }
  }

  const applySuggestion = (suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case "text-improvement":
        // Apply text improvements
        const improvedContent = content.replace(/En este sentido/g, "Por lo tanto")
        onUpdateBookData({ content: improvedContent })
        break
      case "style-suggestion":
        // Apply style changes
        break
      case "cover-idea":
        // Apply cover suggestion
        onUpdateBookData({ coverColor: "#D6BFA2" })
        break
      case "title-suggestion":
        // Apply title suggestion (first one)
        const titles = suggestion.content.split('\n').filter(line => line.trim())
        if (titles.length > 0) {
          const newTitle = titles[0].replace(/^\d+\.\s*/, '')
          onUpdateBookData({ title: newTitle })
        }
        break
      case "content-expansion":
        // Add content expansion
        const expansion = "\n\n## Contexto Adicional\n\nBasado en las tendencias actuales y mejores prácticas..."
        onUpdateBookData({ content: content + expansion })
        break
    }

    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
    )
  }

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return
    
    setIsGenerating(true)
    
    setTimeout(() => {
      const newSuggestion: AISuggestion = {
        id: `custom-${Date.now()}`,
        type: "text-improvement",
        title: "Sugerencia Personalizada",
        description: `Respuesta a: "${customPrompt}"`,
        content: "Basado en tu solicitud, he analizado el contenido y preparado una sugerencia personalizada para mejorar tu libro.",
        icon: Lightbulb,
        applied: false
      }
      
      setSuggestions(prev => [newSuggestion, ...prev])
      setCustomPrompt("")
      setIsGenerating(false)
    }, 2000)
  }

  const handleFeedback = (suggestionId: string, feedback: "positive" | "negative") => {
    setSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, feedback } : s)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold font-serif">IA Copilot</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tu asistente de IA para mejorar y expandir tu libro. 
          Obtén sugerencias inteligentes para contenido, diseño y estructura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="surface-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Herramientas IA
              </CardTitle>
              <CardDescription>
                Selecciona una herramienta para mejorar tu libro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => {
                    setActiveTool(tool.id)
                    generateSuggestion(tool.type)
                  }}
                  disabled={isGenerating}
                >
                  <div className="flex items-center space-x-3">
                    <tool.icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Custom Prompt */}
          <Card className="surface-2">
            <CardHeader>
              <CardTitle className="text-lg">Consulta Personalizada</CardTitle>
              <CardDescription>
                Pide cualquier mejora o sugerencia específica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Tu consulta</Label>
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: ¿Cómo puedo hacer la introducción más interesante?"
                  className="min-h-[80px]"
                />
              </div>
              <Button 
                onClick={handleCustomPrompt}
                disabled={!customPrompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enviar Consulta
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sugerencias Recientes</h3>
            <Badge variant="outline">
              {suggestions.length} sugerencias
            </Badge>
          </div>

          {suggestions.length === 0 && !isGenerating && (
            <Card className="surface-3 border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin Sugerencias</h3>
                <p className="text-muted-foreground mb-4">
                  Selecciona una herramienta para generar sugerencias personalizadas
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <Card className="surface-3">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Generando Sugerencia</p>
                    <p className="text-sm text-muted-foreground">
                      La IA está analizando tu contenido...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className={`surface-1 ${suggestion.applied ? 'border-green-200 bg-green-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <suggestion.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </div>
                    </div>
                    {suggestion.applied && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Aplicada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg">
                    {suggestion.content}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {!suggestion.applied && (
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aplicar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(suggestion.content)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">¿Útil?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`p-1 ${suggestion.feedback === 'positive' ? 'text-green-600' : ''}`}
                        onClick={() => handleFeedback(suggestion.id, 'positive')}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`p-1 ${suggestion.feedback === 'negative' ? 'text-red-600' : ''}`}
                        onClick={() => handleFeedback(suggestion.id, 'negative')}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card className="surface-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{suggestions.length}</div>
              <div className="text-sm text-muted-foreground">Sugerencias Generadas</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {suggestions.filter(s => s.applied).length}
              </div>
              <div className="text-sm text-muted-foreground">Aplicadas</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {suggestions.filter(s => s.feedback === 'positive').length}
              </div>
              <div className="text-sm text-muted-foreground">Feedback Positivo</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{aiTools.length}</div>
              <div className="text-sm text-muted-foreground">Herramientas IA</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}