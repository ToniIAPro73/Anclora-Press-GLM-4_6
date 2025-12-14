"use client";

import { useState, useRef, type DragEvent } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ImportedChapterPayload {
  title: string
  level: number
  html?: string
  markdown?: string
  wordCount?: number
}

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  title: string;
  subtitle: string;
  author: string;
  onMetadataChange: (metadata: {
    title: string;
    subtitle: string;
    author: string;
  }) => void;
  onChaptersDetected?: (chapters: ImportedChapterPayload[]) => void;
}

export default function TextEditor({
  content,
  onChange,
  title,
  subtitle,
  author,
  onMetadataChange,
  onChaptersDetected,
}: TextEditorProps) {
  const { t, mounted, language } = useLanguage();
  const [wordCount, setWordCount] = useState(
    content.split(/\s+/).filter((word) => word.length > 0).length
  );
  const [charCount, setCharCount] = useState(content.length);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = (newContent: string) => {
    onChange(newContent);
    setWordCount(
      newContent.split(/\s+/).filter((word) => word.length > 0).length
    );
    setCharCount(newContent.length);
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById(
      "content-textarea"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    handleContentChange(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**");
        break;
      case "italic":
        insertText("*", "*");
        break;
      case "heading":
        insertText("## ", "");
        break;
      case "quote":
        insertText("> ", "");
        break;
      case "list":
        insertText("- ", "");
        break;
      case "ordered":
        insertText("1. ", "");
        break;
      case "link":
        insertText("[", "](url)");
        break;
      case "image":
        insertText("![alt text](", ")");
        break;
    }
  };

  const canProceed = () => {
    return content.length > 100 && title.length > 0 && author.length > 0;
  };

  const processFile = async (file: File) => {
    setDragActive(false);
    setIsImporting(true);
    setImportStatus({ type: null, message: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // If content is empty or very short, replace it. Otherwise, append.
        let newContent: string;
        if (content.trim().length < 50) {
          // Replace content if it's essentially empty
          newContent = result.content;
          setImportStatus({
            type: "success",
            message: t('texteditor.importSuccess').replace('${filename}', result.originalFileName),
          });
        } else {
          // Append to existing content
          newContent = content + "\n\n" + result.content;
          setImportStatus({
            type: "success",
            message: t('texteditor.importAppended').replace('${filename}', result.originalFileName),
          });
        }

        handleContentChange(newContent);
        if (Array.isArray(result.chapters) && result.chapters.length > 0) {
          onChaptersDetected?.(result.chapters);
        }

        // Extract and update metadata from imported content
        if (result.metadata) {
          let updatedTitle = title;
          let updatedAuthor = author;
          let updatedSubtitle = subtitle;

          // Try to extract title from imported content if no title exists
          if (!title && result.content) {
            const titleMatch = result.content.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              updatedTitle = titleMatch[1].trim();
            } else {
              const firstLine = result.content
                .split("\n")[0]
                .replace(/^#+\s*/, "")
                .trim();
              if (firstLine.length > 0 && firstLine.length < 100) {
                updatedTitle = firstLine;
              }
            }
          }

          // Update metadata if we found new information
          if (
            updatedTitle !== title ||
            updatedAuthor !== author ||
            updatedSubtitle !== subtitle
          ) {
            onMetadataChange({
              title: updatedTitle,
              subtitle: updatedSubtitle,
              author: updatedAuthor,
            });
          }
        }

        // Show import details in console for debugging
        console.log("Import successful:", {
          fileName: result.originalFileName,
          pages: result.metadata?.pages,
          size: result.metadata?.sizeMB,
          contentLength: result.content.length,
        });
      } else {
        setImportStatus({
          type: "error",
          message: result.error || t('texteditor.importError'),
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message: t('texteditor.importConnectionError'),
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileImport = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void processFile(file);
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      if (!isImporting) {
        setDragActive(true);
      }
    } else if (event.type === "dragleave") {
      const related = event.relatedTarget as Node | null;
      if (!related || !event.currentTarget.contains(related)) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isImporting) {
      return;
    }

    setDragActive(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    void processFile(file);
  };

  const clearImportStatus = () => {
    setImportStatus({ type: null, message: "" });
  };

  const supportedFormats = [
    { ext: "txt", name: t('texteditor.plainText'), icon: FileText },
    { ext: "md", name: "Markdown", icon: FileText },
    { ext: "pdf", name: "PDF", icon: File },
    { ext: "doc", name: t('texteditor.word97'), icon: File },
    { ext: "docx", name: t('texteditor.word2007'), icon: File },
    { ext: "rtf", name: t('texteditor.richText'), icon: File },
    { ext: "odt", name: t('texteditor.openDocument'), icon: File },
    { ext: "epub", name: t('texteditor.ebook'), icon: File },
  ];

  const WORDS_PER_PAGE = 200;
  const MAX_PAGES = 300;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));
  const pageUsagePercent = Math.min(
    100,
    Math.round((estimatedPages / MAX_PAGES) * 100)
  );
  const exceedsPageLimit = estimatedPages > MAX_PAGES;

  return (
    <div className="space-y-6">
      {/* Import Status Alert */}
      {importStatus.type && (
        <Alert
          className={
            importStatus.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <div className="flex items-center space-x-2">
            {importStatus.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription
              className={
                importStatus.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {importStatus.message}
            </AlertDescription>
            <Button variant="ghost" size="sm" onClick={clearImportStatus}>
              ×
            </Button>
          </div>
        </Alert>
      )}

      {/* Import Section */}
      <Card className="surface-2">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {mounted && t('import.title')}
          </CardTitle>
          <CardDescription>
            {mounted && t('import.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer",
              dragActive && "border-primary bg-primary/5"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx,.rtf,.odt,.epub"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
              id="file-import"
            />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {isImporting ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">
                  {mounted && (isImporting
                    ? t('import.uploading')
                    : t('import.select'))}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {mounted && (isImporting
                    ? t('import.processing')
                    : t('import.dragdrop'))}
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <File className="w-4 h-4 mr-2" />
                  {mounted && t('import.select')}
                </Button>
              </div>
            </div>
          </div>

          {/* Import Limits Info */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              {mounted && t('texteditor.importLimits')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Páginas:</span>
                <span className="text-muted-foreground">{mounted && t('texteditor.maxPages')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Tamaño:</span>
                <span className="text-muted-foreground">{mounted && t('texteditor.maxSize')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Formatos:</span>
                <span className="text-muted-foreground">{mounted && t('texteditor.supportedFormats')}</span>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{mounted && t('texteditor.formatsSupported')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {supportedFormats.map((format) => (
                <div
                  key={format.ext}
                  className="flex items-center space-x-2 p-2 border rounded-lg surface-1"
                >
                  <format.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">.{format.ext}</div>
                    <div className="text-xs text-muted-foreground">
                      {format.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <Card className="surface-2">
        <CardHeader>
          <CardTitle className="text-lg font-serif">
            {mounted && t('texteditor.title')}
          </CardTitle>
          <CardDescription>
            {mounted && t('texteditor.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{mounted && t('texteditor.bookTitle')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) =>
                  onMetadataChange({ title: e.target.value, subtitle, author })
                }
                placeholder={mounted ? t('texteditor.bookTitlePlaceholder') : ''}
                className="surface-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">{mounted && t('texteditor.author')}</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) =>
                  onMetadataChange({ title, subtitle, author: e.target.value })
                }
                placeholder={mounted ? t('texteditor.authorPlaceholder') : ''}
                className="surface-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">{mounted && t('texteditor.bookSubtitle')}</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) =>
                onMetadataChange({ title, subtitle: e.target.value, author })
              }
              placeholder={mounted ? t('texteditor.bookSubtitlePlaceholder') : ''}
              className="surface-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Editor Toolbar */}
      <Card className="surface-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif">
                {mounted && t('texteditor.content')}
              </CardTitle>
              <CardDescription>
                {mounted && t('texteditor.contentDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {wordCount} {mounted && t('texteditor.words')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {charCount} {mounted && t('texteditor.characters')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="border-b border-border pb-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("bold")}
                  title={mounted ? t('texteditor.bold') : ''}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("italic")}
                  title={mounted ? t('texteditor.italic') : ''}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("heading")}
                  title={mounted ? t('texteditor.title') : ''}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("list")}
                  title={mounted ? t('texteditor.unorderedList') : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("ordered")}
                  title={mounted ? t('texteditor.orderedList') : ''}
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("quote")}
                  title={mounted ? t('texteditor.quote') : ''}
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("link")}
                  title={mounted ? t('texteditor.link') : ''}
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText("image")}
                  title={mounted ? t('texteditor.image') : ''}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-4">
            <Textarea
              id="content-textarea"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={mounted ? (
                language === 'es'
                  ? 'Comienza a escribir el contenido de tu libro...\n\nPuedes usar formato Markdown:\n## Títulos\n**Texto en negrita**\n*Texto en cursiva*\n- Listas desordenadas\n1. Listas ordenadas\n> Citas\n\nEscribe al menos 100 caracteres para continuar al siguiente paso.'
                  : 'Start writing the content of your book...\n\nYou can use Markdown format:\n## Titles\n**Bold text**\n*Italic text*\n- Unordered lists\n1. Ordered lists\n> Quotes\n\nWrite at least 100 characters to continue to the next step.'
              ) : ''}
              className="min-h-[400px] resize-none surface-1 font-mono text-sm leading-relaxed"
            />

            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {content.length < 100
                  ? (mounted && language === 'es'
                      ? `Escribe ${100 - content.length} caracteres más para continuar`
                      : `Write ${100 - content.length} more characters to continue`)
                  : (mounted && language === 'es'
                      ? "✓ Mínimo requerido completado"
                      : "✓ Minimum requirement completed")}
              </span>
              <span>
                {mounted
                  ? language === 'es'
                    ? exceedsPageLimit
                      ? `Estimado: ${estimatedPages} paginas — supera el limite de ${MAX_PAGES}. Maximo 50MB por documento`
                      : `Estimado: ${estimatedPages} paginas (${pageUsagePercent}% del limite de ${MAX_PAGES}). Maximo 50MB por documento`
                    : exceedsPageLimit
                      ? `Estimated: ${estimatedPages} pages — above the ${MAX_PAGES}-page limit. Max 50MB per document`
                      : `Estimated: ${estimatedPages} pages (${pageUsagePercent}% of the ${MAX_PAGES}-page limit). Max 50MB per document`
                  : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="surface-3 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {mounted && t('texteditor.tipsBetter')}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {mounted && language === 'es' ? (
                  <>
                    <li>• Usa títulos (##) para estructurar tu contenido en capítulos</li>
                    <li>• Incluye subtítulos para organizar las secciones</li>
                    <li>• Usa listas para presentar información de forma clara</li>
                    <li>• Añade citas para destacar frases importantes</li>
                    <li>• Revisa la ortografía y gramática antes de continuar</li>
                  </>
                ) : (
                  <>
                    <li>• Use titles (##) to structure your content into chapters</li>
                    <li>• Include subtitles to organize sections</li>
                    <li>• Use lists to present information clearly</li>
                    <li>• Add quotes to highlight important phrases</li>
                    <li>• Review spelling and grammar before continuing</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {!canProceed() && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <FileText className="w-4 h-4" />
              <span className="text-sm">
                {mounted && t('texteditor.minimumContent')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
