"use client"

import { useState } from "react"
import { 
  X, 
  Download, 
  FileText, 
  BookOpen, 
  Settings,
  Check,
  Loader2,
  Share,
  Mail,
  Link,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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

interface ExportModalProps {
  bookData: BookData
  onClose: () => void
}

interface ExportOption {
  id: string
  name: string
  description: string
  icon: React.ElementType
  formats: string[]
  features: string[]
  isPremium?: boolean
}

const exportOptions: ExportOption[] = [
  {
    id: "pdf",
    name: "PDF",
    description: "Formato ideal para impresión y lectura en dispositivos",
    icon: FileText,
    formats: ["PDF"],
    features: [
      "Alta calidad de impresión",
      "Diseño personalizable",
      "Compatible con todos los dispositivos",
      "Incluye portada y contraportada"
    ]
  },
  {
    id: "epub",
    name: "EPUB",
    description: "Formato estándar para lectores de ebooks",
    icon: BookOpen,
    formats: ["EPUB"],
    features: [
      "Texto reflujo adaptable",
      "Navegación por capítulos",
      "Compatible con Kindle, Kobo, etc.",
      "Tamaño de archivo reducido"
    ]
  },
  {
    id: "web",
    name: "Web",
    description: "Publicación online para compartir fácilmente",
    icon: Monitor,
    formats: ["HTML"],
    features: [
      "Acceso desde cualquier navegador",
      "Enlace para compartir",
      "Diseño responsivo",
      "Actualizaciones en tiempo real"
    ],
    isPremium: true
  }
]

const qualityOptions = [
  { id: "standard", name: "Estándar", description: "Calidad normal, tamaño reducido" },
  { id: "high", name: "Alta", description: "Mayor calidad, tamaño moderado" },
  { id: "print", name: "Impresión", description: "Calidad máxima para impresión profesional" }
]

export default function ExportModal({ bookData, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState("pdf")
  const [selectedQuality, setSelectedQuality] = useState("high")
  const [includeOptions, setIncludeOptions] = useState({
    cover: true,
    toc: true,
    pageNumbers: true,
    metadata: true
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportComplete, setExportComplete] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    
    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            setIsExporting(false)
            setExportComplete(true)
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement('a')
    link.href = '#'
    link.download = `${bookData.title || 'libro'}.${selectedFormat === 'pdf' ? 'pdf' : 'epub'}`
    link.click()
  }

  const selectedOption = exportOptions.find(option => option.id === selectedFormat)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Download className="w-5 h-5" />
                Exportar tu Libro
              </CardTitle>
              <CardDescription>
                Elige el formato y opciones para exportar tu libro
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Format Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Formato de Exportación</h3>
                <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exportOptions.map((option) => (
                      <div key={option.id} className="relative">
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <option.icon className="w-5 h-5 text-primary" />
                              <span className="font-medium">{option.name}</span>
                              {option.isPremium && (
                                <Badge variant="secondary" className="text-xs">
                                  Premium
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {option.description}
                          </p>
                          <div className="space-y-1">
                            {option.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-xs">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Quality Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Calidad de Exportación</h3>
                <RadioGroup value={selectedQuality} onValueChange={setSelectedQuality}>
                  {qualityOptions.map((quality) => (
                    <div key={quality.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value={quality.id} id={quality.id} />
                      <div className="flex-1">
                        <Label htmlFor={quality.id} className="font-medium cursor-pointer">
                          {quality.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{quality.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Include Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Opciones Adicionales</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cover"
                      checked={includeOptions.cover}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, cover: checked as boolean }))
                      }
                    />
                    <Label htmlFor="cover" className="cursor-pointer">
                      Incluir portada
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="toc"
                      checked={includeOptions.toc}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, toc: checked as boolean }))
                      }
                    />
                    <Label htmlFor="toc" className="cursor-pointer">
                      Generar tabla de contenidos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="pageNumbers"
                      checked={includeOptions.pageNumbers}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, pageNumbers: checked as boolean }))
                      }
                    />
                    <Label htmlFor="pageNumbers" className="cursor-pointer">
                      Incluir números de página
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="metadata"
                      checked={includeOptions.metadata}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, metadata: checked as boolean }))
                      }
                    />
                    <Label htmlFor="metadata" className="cursor-pointer">
                      Incluir metadatos (autor, título, etc.)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Info */}
            <div className="space-y-6">
              {/* Book Info */}
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg">Información del Libro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Título</Label>
                    <p className="font-medium">{bookData.title || "Sin título"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Autor</Label>
                    <p className="font-medium">{bookData.author || "Sin autor"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Plantilla</Label>
                    <p className="font-medium capitalize">{bookData.template}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Palabras</Label>
                    <p className="font-medium">{bookData.content.split(/\s+/).filter(word => word.length > 0).length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Export Progress */}
              {isExporting && (
                <Card className="surface-3">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exportando...
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progreso</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Message */}
              {exportComplete && (
                <Card className="surface-3 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <Check className="w-5 h-5" />
                      ¡Exportación Completada!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-green-600">
                      Tu libro ha sido exportado exitosamente en formato {selectedFormat.toUpperCase()}.
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="w-4 h-4 mr-2" />
                        Compartir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device Compatibility */}
              <Card className="surface-2">
                <CardHeader>
                  <CardTitle className="text-lg">Compatibilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Móviles y tablets</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Computadoras</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">E-readers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>
                Formato: {selectedOption?.name.toUpperCase()} • 
                Calidad: {qualityOptions.find(q => q.id === selectedQuality)?.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting || exportComplete}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : exportComplete ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Completado
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}