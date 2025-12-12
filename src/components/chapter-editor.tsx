"use client"

import { useState } from "react"
import { 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Move,
  Eye,
  Edit,
  Save,
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Book,
  Clock,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Chapter {
  id: string
  title: string
  content: string
  order: number
  wordCount: number
  lastModified: Date
  status: 'draft' | 'completed' | 'reviewed'
}

interface ChapterEditorProps {
  chapters: Chapter[]
  onChaptersChange: (chapters: Chapter[]) => void
  onChapterSelect: (chapter: Chapter) => void
  selectedChapter: Chapter | null
}

const chapterStatuses = [
  { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'completed', label: 'Completado', color: 'bg-blue-100 text-blue-800' },
  { value: 'reviewed', label: 'Revisado', color: 'bg-green-100 text-green-800' }
]

export default function ChapterEditor({
  chapters,
  onChaptersChange,
  onChapterSelect,
  selectedChapter
}: ChapterEditorProps) {
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showImportDialog, setShowImportDialog] = useState(false)

  const createChapter = () => {
    if (!newChapterTitle.trim()) return

    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapterTitle,
      content: "",
      order: chapters.length + 1,
      wordCount: 0,
      lastModified: new Date(),
      status: 'draft'
    }

    onChaptersChange([...chapters, newChapter])
    setNewChapterTitle("")
    onChapterSelect(newChapter)
  }

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, ...updates, lastModified: new Date() }
        : chapter
    )
    onChaptersChange(updatedChapters)
  }

  const deleteChapter = (chapterId: string) => {
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId)
    onChaptersChange(updatedChapters)
    
    // Update order
    const reorderedChapters = updatedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1
    }))
    onChaptersChange(reorderedChapters)
  }

  const duplicateChapter = (chapter: Chapter) => {
    const duplicatedChapter: Chapter = {
      ...chapter,
      id: `chapter-${Date.now()}`,
      title: `${chapter.title} (copia)`,
      order: chapters.length + 1,
      lastModified: new Date()
    }
    onChaptersChange([...chapters, duplicatedChapter])
  }

  const reorderChapters = (fromIndex: number, toIndex: number) => {
    const reorderedChapters = [...chapters]
    const [movedChapter] = reorderedChapters.splice(fromIndex, 1)
    reorderedChapters.splice(toIndex, 0, movedChapter)
    
    // Update order
    const reorderedWithOrder = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1
    }))
    
    onChaptersChange(reorderedWithOrder)
  }

  const importChapter = (content: string, title: string) => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: title || "Capítulo Importado",
      content,
      order: chapters.length + 1,
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      lastModified: new Date(),
      status: 'draft'
    }
    onChaptersChange([...chapters, newChapter])
    setShowImportDialog(false)
  }

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chapter.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || chapter.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalWordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif">Editor de Capítulos</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Organiza tu libro en capítulos individuales para mejor estructura 
          y control sobre cada sección del contenido.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="surface-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Capítulos</CardTitle>
                  <CardDescription>
                    {chapters.length} capítulos • {totalWordCount} palabras
                  </CardDescription>
                </div>
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importar Capítulo</DialogTitle>
                      <DialogDescription>
                        Importa contenido desde un archivo para crear un nuevo capítulo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="import-title">Título del capítulo</Label>
                        <Input
                          id="import-title"
                          placeholder="Título del capítulo importado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="import-content">Contenido</Label>
                        <Textarea
                          id="import-content"
                          placeholder="Pega el contenido del capítulo aquí..."
                          className="min-h-[200px]"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => {
                          const title = (document.getElementById('import-title') as HTMLInputElement)?.value || ''
                          const content = (document.getElementById('import-content') as HTMLTextAreaElement)?.value || ''
                          importChapter(content, title)
                        }}>
                          Importar Capítulo
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar capítulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borradores</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="reviewed">Revisados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredChapters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay capítulos</p>
                    <p className="text-sm">Crea tu primer capítulo para comenzar</p>
                  </div>
                ) : (
                  filteredChapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedChapter?.id === chapter.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => onChapterSelect(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {chapter.order}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{chapter.title}</h4>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{chapter.wordCount} palabras</span>
                              <span>•</span>
                              <span>{new Date(chapter.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge className={chapterStatuses.find(s => s.value === chapter.status)?.color}>
                            {chapterStatuses.find(s => s.value === chapter.status)?.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateChapter(chapter)
                            }}
                            title="Duplicar capítulo"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChapter(chapter.id)
                            }}
                            title="Eliminar capítulo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Chapter */}
              <div className="pt-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Título del nuevo capítulo..."
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        createChapter()
                      }
                    }}
                  />
                  <Button onClick={createChapter} disabled={!newChapterTitle.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Capítulo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapter Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedChapter ? (
            <>
              <Card className="surface-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        {editingChapter === selectedChapter.id ? 'Editando' : selectedChapter.title}
                      </CardTitle>
                      <CardDescription>
                        Capítulo {selectedChapter.order} • {selectedChapter.wordCount} palabras
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedChapter.status}
                        onValueChange={(value) => updateChapter(selectedChapter.id, { status: value as Chapter['status'] })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {chapterStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="surface-1">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapter-title">Título del Capítulo</Label>
                      <Input
                        id="chapter-title"
                        value={selectedChapter.title}
                        onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
                        placeholder="Título del capítulo"
                        className="surface-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapter-content">Contenido del Capítulo</Label>
                      <Textarea
                        id="chapter-content"
                        value={selectedChapter.content}
                        onChange={(e) => {
                          updateChapter(selectedChapter.id, { 
                            content: e.target.value,
                            wordCount: e.target.value.split(/\s+/).filter(word => word.length > 0).length
                          })
                        }}
                        placeholder="Escribe el contenido de este capítulo..."
                        className="min-h-[400px] resize-none surface-2 font-mono text-sm leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{selectedChapter.wordCount} palabras</span>
                        <span>
                          Última modificación: {new Date(selectedChapter.lastModified).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="surface-2">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecciona un Capítulo</h3>
                <p className="text-muted-foreground mb-4">
                  Elige un capítulo de la lista para comenzar a editar
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>O crea un nuevo capítulo usando el formulario de la izquierda</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <Card className="surface-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{chapters.length}</div>
              <div className="text-sm text-muted-foreground">Total Capítulos</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {chapters.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completados</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {chapters.filter(c => c.status === 'draft').length}
              </div>
              <div className="text-sm text-muted-foreground">Borradores</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{totalWordCount}</div>
              <div className="text-sm text-muted-foreground">Palabras Totales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}