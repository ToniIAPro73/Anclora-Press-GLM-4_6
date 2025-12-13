"use client"

import { useState } from "react"
import { 
  X, 
  Download, 
  Share, 
  Eye, 
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  BookOpen,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

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

interface PreviewModalProps {
  bookData: BookData
  onClose: () => void
}

export default function PreviewModal({ bookData, onClose }: PreviewModalProps) {
  const [zoom, setZoom] = useState([100])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"single" | "double">("single")

  // Parse content to simulate pages
  const wordsPerPage = 300
  const words = bookData.content.split(/\s+/).filter(word => word.length > 0)
  const totalPages = Math.ceil(words.length / wordsPerPage) || 1

  const getCurrentPageContent = (pageNum: number) => {
    const startIndex = (pageNum - 1) * wordsPerPage
    const endIndex = startIndex + wordsPerPage
    return words.slice(startIndex, endIndex).join(" ")
  }

  const handleZoomIn = () => {
    setZoom([Math.min(zoom[0] + 10, 200)])
  }

  const handleZoomOut = () => {
    setZoom([Math.max(zoom[0] - 10, 50)])
  }

  const handleResetZoom = () => {
    setZoom([100])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Vista Previa del Libro
              </CardTitle>
              <CardDescription>
                Revisa cómo se verá tu libro antes de publicarlo
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "single" ? "double" : "single")}
              >
                <Monitor className="w-4 h-4 mr-2" />
                {viewMode === "single" ? "Doble Página" : "Página Simple"}
              </Button>
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom[0] <= 50}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                  {zoom[0]}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom[0] >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Página {currentPage} de {totalPages}
              </Badge>
              <Badge variant="secondary">
                {words.length} palabras
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 overflow-auto p-6">
          <div className="flex justify-center">
            <div 
              className="transition-transform duration-200"
              style={{ transform: `scale(${zoom[0] / 100})` }}
            >
              <div className="flex gap-8">
                {/* Book Pages */}
                {viewMode === "single" ? (
                  <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width: "400px" }}>
                    {/* Cover */}
                    {currentPage === 1 && (
                      <div className="aspect-[3/4] relative" style={{ backgroundColor: bookData.coverColor }}>
                        {bookData.coverImage && (
                          <img 
                            src={bookData.coverImage} 
                            alt="Book cover preview" 
                            className="w-full h-full object-cover opacity-80"
                          />
                        )}
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
                          <h1 className="text-2xl font-bold font-serif mb-4">{bookData.title}</h1>
                          {bookData.subtitle && (
                            <p className="text-lg mb-8 opacity-90">{bookData.subtitle}</p>
                          )}
                          <p className="text-lg opacity-90">{bookData.author}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Content Pages */}
                    {currentPage > 1 && (
                      <div className="aspect-[3/4] p-8 bg-white text-gray-900">
                        <div className="h-full flex flex-col">
                          <div className="flex-1">
                            <h2 className="text-xl font-bold font-serif mb-4">
                              {currentPage === 2 ? "Capítulo 1" : `Página ${currentPage - 1}`}
                            </h2>
                            <div className="text-sm leading-relaxed space-y-4">
                              {getCurrentPageContent(currentPage - 1).split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-500 mt-4">
                            {currentPage - 1}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Double Page View */
                  <>
                    {/* Left Page */}
                    <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width: "400px" }}>
                      {currentPage === 1 ? (
                        <div className="aspect-[3/4] relative" style={{ backgroundColor: bookData.coverColor }}>
                          {bookData.coverImage && (
                            <img 
                              src={bookData.coverImage} 
                              alt="Book cover preview double page" 
                              className="w-full h-full object-cover opacity-80"
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
                            <h1 className="text-2xl font-bold font-serif mb-4">{bookData.title}</h1>
                            {bookData.subtitle && (
                              <p className="text-lg mb-8 opacity-90">{bookData.subtitle}</p>
                            )}
                            <p className="text-lg opacity-90">{bookData.author}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] p-8 bg-white text-gray-900">
                          <div className="h-full flex flex-col">
                            <div className="flex-1">
                              <h2 className="text-xl font-bold font-serif mb-4">
                                {currentPage === 2 ? "Capítulo 1" : `Página ${currentPage - 1}`}
                              </h2>
                              <div className="text-sm leading-relaxed space-y-4">
                                {getCurrentPageContent(currentPage - 1).split('\n').map((paragraph, index) => (
                                  <p key={index}>{paragraph}</p>
                                ))}
                              </div>
                            </div>
                            <div className="text-center text-xs text-gray-500 mt-4">
                              {currentPage - 1}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Page */}
                    {currentPage < totalPages && (
                      <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width: "400px" }}>
                        <div className="aspect-[3/4] p-8 bg-white text-gray-900">
                          <div className="h-full flex flex-col">
                            <div className="flex-1">
                              <h2 className="text-xl font-bold font-serif mb-4">
                                {currentPage === 1 ? "Capítulo 1" : `Página ${currentPage}`}
                              </h2>
                              <div className="text-sm leading-relaxed space-y-4">
                                {getCurrentPageContent(currentPage).split('\n').map((paragraph, index) => (
                                  <p key={index}>{paragraph}</p>
                                ))}
                              </div>
                            </div>
                            <div className="text-center text-xs text-gray-500 mt-4">
                              {currentPage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer Navigation */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - (viewMode === "double" ? 2 : 1)))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + (viewMode === "double" ? 2 : 1)))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Slider
                value={[currentPage]}
                onValueChange={(value) => setCurrentPage(value[0])}
                max={totalPages}
                min={1}
                step={1}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                de {totalPages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="default">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}