"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
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
  Hash,
  ArrowUp,
  ArrowDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  lastModified: Date;
  status: "draft" | "completed" | "reviewed";
}

interface ChapterEditorProps {
  chapters: Chapter[];
  onChaptersChange: (chapters: Chapter[]) => void;
  onChapterSelect: (chapter: Chapter) => void;
  selectedChapter: Chapter | null;
}

export default function ChapterEditor({
  chapters,
  onChaptersChange,
  onChapterSelect,
  selectedChapter,
}: ChapterEditorProps) {
  const { t, mounted, language } = useLanguage();

  const chapterStatuses = [
    {
      value: "draft",
      label: t("chapter.draft"),
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "completed",
      label: t("chapter.completed"),
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "reviewed",
      label: t("chapter.reviewed"),
      color: "bg-green-100 text-green-800",
    },
  ];

  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importPosition, setImportPosition] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createChapter = () => {
    if (!newChapterTitle.trim()) return;

    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapterTitle,
      content: "",
      order: chapters.length + 1,
      wordCount: 0,
      lastModified: new Date(),
      status: "draft",
    };

    onChaptersChange([...chapters, newChapter]);
    setNewChapterTitle("");
    onChapterSelect(newChapter);
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = chapters.map((chapter) =>
      chapter.id === chapterId
        ? { ...chapter, ...updates, lastModified: new Date() }
        : chapter
    );
    onChaptersChange(updatedChapters);
  };

  const deleteChapter = (chapterId: string) => {
    const updatedChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId
    );
    onChaptersChange(updatedChapters);

    // Update order
    const reorderedChapters = updatedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));
    onChaptersChange(reorderedChapters);
  };

  const duplicateChapter = (chapter: Chapter) => {
    const copyLabel = mounted && language === "es" ? "(copia)" : "(copy)";
    const duplicatedChapter: Chapter = {
      ...chapter,
      id: `chapter-${Date.now()}`,
      title: `${chapter.title} ${copyLabel}`,
      order: chapters.length + 1,
      lastModified: new Date(),
    };
    onChaptersChange([...chapters, duplicatedChapter]);
  };

  const reorderChapters = (fromIndex: number, toIndex: number) => {
    const reorderedChapters = [...chapters];
    const [movedChapter] = reorderedChapters.splice(fromIndex, 1);
    reorderedChapters.splice(toIndex, 0, movedChapter);

    // Update order
    const reorderedWithOrder = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));

    onChaptersChange(reorderedWithOrder);
  };

  const clampPosition = useCallback(
    (value: number) => Math.max(0, Math.min(value, chapters.length)),
    [chapters.length]
  );

  const resetImportState = useCallback(() => {
    setImportTitle("");
    setImportContent("");
    setImportPosition(0);
    setImportError(null);
    setIsUploadingFile(false);
    setIsDraggingFile(false);
  }, []);

  const handleImportDialogChange = (open: boolean) => {
    setShowImportDialog(open);
    if (!open) {
      resetImportState();
    } else {
      setImportPosition(0);
      setImportError(null);
    }
  };

  const importChapter = (content: string, title: string, position = chapters.length) => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: title || t("chapter.importDialog"),
      content,
      order: position + 1,
      wordCount: content.split(/\s+/).filter((word) => word.length > 0).length,
      lastModified: new Date(),
      status: "draft",
    };
    const insertIndex = clampPosition(position);
    const updatedChapters = [...chapters];
    updatedChapters.splice(insertIndex, 0, newChapter);
    const normalized = updatedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));
    onChaptersChange(normalized);
    setShowImportDialog(false);
    resetImportState();
  };

  const filteredChapters = chapters.filter((chapter) => {
    const matchesSearch =
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || chapter.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const previewChapters = useMemo(() => {
    const items = chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      status: chapter.status,
      isNew: false,
    }));
    const placeholder =
      importTitle.trim() ||
      (mounted
        ? language === "es"
          ? "Nuevo capítulo importado"
          : "Imported chapter"
        : "Imported chapter");
    items.splice(Math.min(importPosition, items.length), 0, {
      id: "new",
      title: placeholder,
      status: "draft",
      isNew: true,
    });
    return items;
  }, [chapters, importPosition, importTitle, mounted, language]);

  const movePreviewPosition = (direction: "up" | "down") => {
    setImportPosition((prev) =>
      clampPosition(prev + (direction === "up" ? -1 : 1))
    );
  };

  const handleImportSubmit = () => {
    if (!importContent.trim()) {
      setImportError(
        mounted
          ? language === "es"
            ? "Añade contenido para importar el capítulo."
            : "Add content to import the chapter."
          : "Add content"
      );
      return;
    }
    importChapter(importContent, importTitle, importPosition);
  };

  const handleFileProcess = async (file: File) => {
    setIsUploadingFile(true);
    setImportError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setImportContent(result.content || "");
        if (!importTitle && result.metadata?.title) {
          setImportTitle(result.metadata.title);
        }
      } else {
        setImportError(result.error || "No se pudo procesar el archivo seleccionado.");
      }
    } catch (error) {
      console.error("Import file error:", error);
      setImportError(
        mounted
          ? language === "es"
            ? "No se pudo leer el archivo seleccionado."
            : "Unable to read the selected file."
          : "Unable to read the selected file."
      );
    } finally {
      setIsUploadingFile(false);
      setIsDraggingFile(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const totalWordCount = chapters.reduce(
    (total, chapter) => total + chapter.wordCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif">
          {mounted && t("chapter.title")}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {mounted && t("chapter.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="surface-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {mounted && t("chapter.chapters")}
                  </CardTitle>
                  <CardDescription>
                    {mounted &&
                      t("chapter.chaptersCount")
                        .replace("${count}", chapters.length.toString())
                        .replace("${words}", totalWordCount.toString())}
                  </CardDescription>
                </div>
                <Dialog
                  open={showImportDialog}
                  onOpenChange={handleImportDialogChange}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      {mounted && t("chapter.import")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-screen h-screen max-w-none sm:max-w-none p-0 sm:rounded-none border-none bg-background overflow-hidden">
                    <div className="flex h-full flex-col w-full px-6 sm:px-8 py-6">
                      <DialogHeader className="pb-4 border-b border-border">
                        <DialogTitle className="text-2xl font-semibold font-serif">
                          {mounted && t("chapter.importDialog")}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                          {mounted &&
                            (language === "es"
                              ? "Importa un archivo o pega el contenido para crear un nuevo capítulo."
                              : "Import a file or paste text to create a new chapter.")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 flex flex-col min-h-0 py-6">
                        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 overflow-hidden">
                          <div className="flex flex-col min-h-0 rounded-2xl border border-border bg-card/40">
                            <div className="flex-1 overflow-auto p-6 space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="import-title">
                                  {mounted && t("chapter.chapterTitle")}
                                </Label>
                                <Input
                                  id="import-title"
                                  value={importTitle}
                                  onChange={(e) => setImportTitle(e.target.value)}
                                  placeholder={
                                    mounted
                                      ? t("chapter.chapterTitlePlaceholder")
                                      : ""
                                  }
                                />
                              </div>
                              <div className="space-y-3">
                                <Label>
                                  {mounted
                                    ? language === "es"
                                      ? "Selecciona un archivo o arrástralo aquí"
                                      : "Select a file or drag it here"
                                    : "Select a file"}
                                </Label>
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDraggingFile(true);
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    setIsDraggingFile(false);
                                  }}
                                  onDrop={handleDrop}
                                  className={cn(
                                    "border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors",
                                    isDraggingFile
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-muted/30"
                                  )}
                                >
                                  <Upload className="w-8 h-8 mx-auto mb-3 text-primary" />
                                  <p className="font-medium">
                                    {mounted
                                      ? language === "es"
                                        ? "Arrastra tu archivo aquí"
                                        : "Drag your file here"
                                      : "Drag your file here"}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {mounted
                                      ? language === "es"
                                        ? "Formatos soportados: txt, md, docx, pdf, rtf, odt."
                                        : "Supported formats: txt, md, docx, pdf, rtf, odt."
                                      : "Supported formats: txt, md, docx, pdf, rtf, odt."}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUploadingFile}
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    {isUploadingFile
                                      ? mounted && language === "es"
                                        ? "Procesando..."
                                        : "Processing..."
                                      : mounted && language === "es"
                                      ? "Seleccionar archivo"
                                      : "Select file"}
                                  </Button>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".txt,.md,.doc,.docx,.pdf,.rtf,.odt"
                                    onChange={handleFileInputChange}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2 flex flex-col min-h-[360px]">
                                <Label htmlFor="import-content">
                                  {mounted && t("chapter.content")}
                                </Label>
                                <Textarea
                                  id="import-content"
                                  value={importContent}
                                  onChange={(e) => setImportContent(e.target.value)}
                                  placeholder={
                                    mounted ? t("chapter.contentPlaceholder") : ""
                                  }
                                  wrap="off"
                                  spellCheck={false}
                                  className="flex-1 min-h-[320px] resize-none overflow-auto font-mono text-sm rounded-xl border border-border bg-background/90"
                                  style={{ whiteSpace: "pre", wordBreak: "normal" }}
                                />
                                {importError && (
                                  <p className="text-sm text-destructive">{importError}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col min-h-0 rounded-2xl border border-border bg-card/70">
                            <div className="border-b border-border px-6 py-4">
                              <h4 className="font-semibold">
                                {mounted
                                  ? language === "es"
                                    ? "Orden del capítulo"
                                    : "Chapter order"
                                  : "Chapter order"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {mounted
                                  ? language === "es"
                                    ? "El capítulo importado aparece al inicio. Usa las flechas para moverlo."
                                    : "The imported chapter appears first. Use the arrows to reposition it."
                                  : "Use the arrows to reposition the imported chapter."}
                              </p>
                            </div>
                            <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
                              {previewChapters.map((item, index) => (
                                <div
                                  key={`${item.id}-${index}`}
                                  className={cn(
                                    "p-3 rounded-lg border flex justify-between items-center",
                                    item.isNew
                                      ? "border-primary bg-primary/5"
                                      : "border-border"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-muted text-xs font-medium flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="font-medium">{item.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.isNew
                                          ? mounted
                                            ? language === "es"
                                              ? "Capítulo importado"
                                              : "Imported chapter"
                                            : "Imported chapter"
                                          : chapterStatuses.find(
                                              (status) => status.value === item.status
                                            )?.label || item.status}
                                      </p>
                                    </div>
                                  </div>
                                  {item.isNew && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => movePreviewPosition("up")}
                                        disabled={importPosition === 0}
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => movePreviewPosition("down")}
                                        disabled={importPosition >= chapters.length}
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => setShowImportDialog(false)}
                        >
                          {mounted && t("chapter.cancel")}
                        </Button>
                        <Button onClick={handleImportSubmit}>
                          {mounted
                            ? language === "es"
                              ? "Importar"
                              : "Import"
                            : "Import"}
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
                    placeholder={
                      mounted
                        ? language === "es"
                          ? "Buscar capítulos..."
                          : "Search chapters..."
                        : "Search..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        mounted
                          ? language === "es"
                            ? "Filtrar por estado"
                            : "Filter by status"
                          : "Filter"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {mounted
                        ? language === "es"
                          ? "Todos los estados"
                          : "All statuses"
                        : "All"}
                    </SelectItem>
                    <SelectItem value="draft">
                      {mounted ? t("chapter.draft") : "Draft"}
                    </SelectItem>
                    <SelectItem value="completed">
                      {mounted ? t("chapter.completed") : "Completed"}
                    </SelectItem>
                    <SelectItem value="reviewed">
                      {mounted ? t("chapter.reviewed") : "Reviewed"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredChapters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {mounted
                        ? language === "es"
                          ? "No hay capítulos"
                          : "No chapters"
                        : "No chapters"}
                    </p>
                    <p className="text-sm">
                      {mounted
                        ? language === "es"
                          ? "Crea tu primer capítulo para comenzar"
                          : "Create your first chapter to start"
                        : "Create your first chapter"}
                    </p>
                  </div>
                ) : (
                  filteredChapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedChapter?.id === chapter.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => onChapterSelect(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {chapter.order}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {chapter.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>
                                {chapter.wordCount}{" "}
                                {mounted
                                  ? language === "es"
                                    ? "palabras"
                                    : "words"
                                  : "words"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  chapter.lastModified
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge
                            className={
                              chapterStatuses.find(
                                (s) => s.value === chapter.status
                              )?.color
                            }
                          >
                            {
                              chapterStatuses.find(
                                (s) => s.value === chapter.status
                              )?.label
                            }
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateChapter(chapter);
                            }}
                            title={
                              mounted
                                ? language === "es"
                                  ? "Duplicar capítulo"
                                  : "Duplicate chapter"
                                : "Duplicate"
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChapter(chapter.id);
                            }}
                            title={
                              mounted
                                ? language === "es"
                                  ? "Eliminar capítulo"
                                  : "Delete chapter"
                                : "Delete"
                            }
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
                    placeholder={
                      mounted
                        ? language === "es"
                          ? "Título del nuevo capítulo..."
                          : "New chapter title..."
                        : "Chapter title..."
                    }
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        createChapter();
                      }
                    }}
                  />
                  <Button
                    onClick={createChapter}
                    disabled={!newChapterTitle.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {mounted
                      ? language === "es"
                        ? "Añadir Capítulo"
                        : "Add Chapter"
                      : "Add"}
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
                        {editingChapter === selectedChapter.id
                          ? mounted
                            ? language === "es"
                              ? "Editando"
                              : "Editing"
                            : "Editing"
                          : selectedChapter.title}
                      </CardTitle>
                      <CardDescription>
                        {mounted &&
                          (language === "es"
                            ? `Capítulo ${selectedChapter.order} • ${selectedChapter.wordCount} palabras`
                            : `Chapter ${selectedChapter.order} • ${selectedChapter.wordCount} words`)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedChapter.status}
                        onValueChange={(value) =>
                          updateChapter(selectedChapter.id, {
                            status: value as Chapter["status"],
                          })
                        }
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
                        {mounted
                          ? language === "es"
                            ? "Guardar"
                            : "Save"
                          : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="surface-1">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapter-title">
                        {mounted
                          ? language === "es"
                            ? "Título del Capítulo"
                            : "Chapter Title"
                          : "Title"}
                      </Label>
                      <Input
                        id="chapter-title"
                        value={selectedChapter.title}
                        onChange={(e) =>
                          updateChapter(selectedChapter.id, {
                            title: e.target.value,
                          })
                        }
                        placeholder={
                          mounted
                            ? language === "es"
                              ? "Título del capítulo"
                              : "Chapter title"
                            : "Title"
                        }
                        className="surface-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapter-content">
                        {mounted
                          ? language === "es"
                            ? "Contenido del Capítulo"
                            : "Chapter Content"
                          : "Content"}
                      </Label>
                      <Textarea
                        id="chapter-content"
                        value={selectedChapter.content}
                        onChange={(e) => {
                          updateChapter(selectedChapter.id, {
                            content: e.target.value,
                            wordCount: e.target.value
                              .split(/\s+/)
                              .filter((word) => word.length > 0).length,
                          });
                        }}
                        placeholder={
                          mounted
                            ? language === "es"
                              ? "Escribe el contenido de este capítulo..."
                              : "Write the content of this chapter..."
                            : "Write content..."
                        }
                        className="min-h-[400px] resize-none surface-2 font-mono text-sm leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {selectedChapter.wordCount}{" "}
                          {mounted
                            ? language === "es"
                              ? "palabras"
                              : "words"
                            : "words"}
                        </span>
                        <span>
                          {mounted &&
                            (language === "es"
                              ? "Última modificación:"
                              : "Last modified:")}{" "}
                          {new Date(
                            selectedChapter.lastModified
                          ).toLocaleString()}
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
                <h3 className="text-lg font-semibold mb-2">
                  {mounted
                    ? language === "es"
                      ? "Selecciona un Capítulo"
                      : "Select a Chapter"
                    : "Select"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {mounted
                    ? language === "es"
                      ? "Elige un capítulo de la lista para comenzar a editar"
                      : "Choose a chapter from the list to start editing"
                    : "Choose a chapter"}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {mounted
                      ? language === "es"
                        ? "O crea un nuevo capítulo usando el formulario de la izquierda"
                        : "Or create a new chapter using the form on the left"
                      : "Or create new"}
                  </p>
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
              <div className="text-2xl font-bold text-primary">
                {chapters.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Total Capítulos"
                    : "Total Chapters"
                  : "Total"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {chapters.filter((c) => c.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted ? t("chapter.completed") : "Completed"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {chapters.filter((c) => c.status === "draft").length}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted ? t("chapter.draft") : "Draft"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {totalWordCount}
              </div>
              <div className="text-sm text-muted-foreground">
                {mounted
                  ? language === "es"
                    ? "Palabras Totales"
                    : "Total Words"
                  : "Total"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
