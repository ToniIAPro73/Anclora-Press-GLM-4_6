"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  BookOpen,
  Upload,
  Download,
  Eye,
  Palette,
  Users,
  Sparkles,
  Monitor,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeLanguageControls } from "@/components/theme-language-controls";
import { useLanguage } from "@/hooks/use-language";

// Import components
import TextEditor from "./text-editor";
import EnhancedTextEditor from "./enhanced-text-editor";
import ChapterEditor from "./chapter-editor";
import BackCoverEditor from "./back-cover-editor";
import TemplateGallery from "./template-gallery";
import CoverEditor from "./cover-editor";
import PreviewModal from "./preview-modal";
import ExportModal from "./export-modal";
import AICopilot from "./ai-copilot";
import CollaborationPanel from "./collaboration-panel";
import { FloatingNavigator } from "./floating-navigator";

interface Review {
  id: string;
  text: string;
  author: string;
  source: string;
}

interface BackCoverData {
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  publicationDate?: string;
  description?: string;
  reviews: Review[];
  selectedLayout: string;
}

interface BookData {
  title: string;
  subtitle: string;
  author: string;
  content: string;
  template: string;
  coverImage: string | null;
  coverColor: string;
  genre: string;
  backCoverData?: BackCoverData | null;
  chapters?: any[];
}

type ImportedChapterPayload = {
  title?: string;
  level?: number;
  html?: string;
  markdown?: string;
  wordCount?: number;
};

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "active" | "completed";
}

export default function AncloraPress() {
  const { t, language, mounted } = useLanguage();
  const [activeStep, setActiveStep] = useState(1);
  const [bookData, setBookData] = useState<BookData>({
    title: "",
    subtitle: "",
    author: "",
    content: "",
    template: "modern",
    coverImage: null,
    coverColor: "#D6BFA2",
    genre: "fiction",
    backCoverData: null,
    chapters: [],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);

  const [comments, setComments] = useState<any[]>([]);
  const [versions, setVersions] = useState([
    {
      id: "v1",
      author: "Usuario Actual",
      timestamp: new Date(),
      message: "Versión inicial del libro",
      changes: { added: 1250, removed: 0, modified: 0 },
    },
  ]);

  const [collaborators] = useState([
    {
      id: "1",
      name: "Ana García",
      email: "ana@example.com",
      role: "owner" as const,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "online" as const,
    },
    {
      id: "2",
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      role: "editor" as const,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "online" as const,
    },
    {
      id: "3",
      name: "María Rodríguez",
      email: "maria@example.com",
      role: "commenter" as const,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "offline" as const,
    },
  ]);

  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: true,
  });
  const [navigatorOffset, setNavigatorOffset] = useState(16);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const steps: Step[] = mounted ? [
    {
      id: 1,
      title: t('step.content.title'),
      description: t('step.content.description'),
      icon: Upload,
      status:
        activeStep === 1 ? "active" : activeStep > 1 ? "completed" : "pending",
    },
    {
      id: 2,
      title: t('step.chapters.title'),
      description: t('step.chapters.description'),
      icon: FileText,
      status:
        activeStep === 2 ? "active" : activeStep > 2 ? "completed" : "pending",
    },
    {
      id: 3,
      title: t('step.template.title'),
      description: t('step.template.description'),
      icon: Palette,
      status:
        activeStep === 3 ? "active" : activeStep > 3 ? "completed" : "pending",
    },
    {
      id: 4,
      title: t('step.cover.title'),
      description: t('step.cover.description'),
      icon: BookOpen,
      status:
        activeStep === 4 ? "active" : activeStep > 4 ? "completed" : "pending",
    },
    {
      id: 5,
      title: t('step.backcover.title'),
      description: t('step.backcover.description'),
      icon: BookOpen,
      status:
        activeStep === 5 ? "active" : activeStep > 5 ? "completed" : "pending",
    },
    {
      id: 6,
      title: t('step.preview.title'),
      description: t('step.preview.description'),
      icon: Monitor,
      status:
        activeStep === 6 ? "active" : activeStep > 6 ? "completed" : "pending",
    },
    {
      id: 7,
      title: t('step.collaborate.title'),
      description: t('step.collaborate.description'),
      icon: Users,
      status:
        activeStep === 7 ? "active" : activeStep > 7 ? "completed" : "pending",
    },
    {
      id: 8,
      title: t('step.ai.title'),
      description: t('step.ai.description'),
      icon: Sparkles,
      status:
        activeStep === 8 ? "active" : activeStep > 8 ? "completed" : "pending",
    },
    {
      id: 9,
      title: t('step.export.title'),
      description: t('step.export.description'),
      icon: Download,
      status:
        activeStep === 9 ? "active" : activeStep > 9 ? "completed" : "pending",
    },
  ] : [];

  const updateBookData = (updates: Partial<BookData>) => {
    setBookData((prev) => ({ ...prev, ...updates }));
  };

  const handleImportedChapters = useCallback(
    (sections?: ImportedChapterPayload[]) => {
      if (!sections || sections.length === 0) return;

      const base = Date.now();
      const stripHtml = (text: string) => text.replace(/<[^>]+>/g, " ");

      const mapped = sections.map((section, index) => {
        const rawContent = section.markdown || section.html || "";
        const wordCount =
          section.wordCount ||
          stripHtml(rawContent)
            .split(/\s+/)
            .filter((word) => word.length > 0).length;

        return {
          id: `imported-${base}-${index}`,
          title: section.title || `Capitulo ${index + 1}`,
          content: rawContent,
          order: index,
          wordCount,
          lastModified: new Date(),
          status: "draft" as const,
        };
      });

      if (mapped.length > 0) {
        updateBookData({ chapters: mapped });
      }
    },
    [updateBookData]
  );

  const canProceed = () => {
    switch (activeStep) {
      case 1:
        return bookData.content.length > 100;
      case 2:
        return bookData.chapters && bookData.chapters.length > 0;
      case 3:
        return bookData.template !== "";
      case 4:
        return bookData.title !== "" && bookData.author !== "";
      case 5:
        return bookData.backCoverData !== null;
      default:
        return true;
    }
  };

  const updateNavigatorOffset = useCallback(() => {
    if (typeof window === "undefined" || !contentRef.current) {
      setNavigatorOffset(16);
      return;
    }
    const rect = contentRef.current.getBoundingClientRect();
    const rightMargin = window.innerWidth - rect.right;
    const navigatorWidth = 128;

    if (rightMargin > navigatorWidth + 16) {
      const centered = (rightMargin - navigatorWidth) / 2;
      setNavigatorOffset(Math.max(12, centered));
    } else {
      setNavigatorOffset(12);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateScrollState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollState({
        canScrollUp: scrollTop > 24,
        canScrollDown: maxScroll - scrollTop > 24,
      });
    };
    updateScrollState();
    updateNavigatorOffset();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    window.addEventListener("resize", updateNavigatorOffset);
    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      window.removeEventListener("resize", updateNavigatorOffset);
    };
  }, [updateNavigatorOffset]);

  useEffect(() => {
    updateNavigatorOffset();
  }, [updateNavigatorOffset, activeStep]);

  const totalSteps = steps.length || 1;

  const scrollByViewport = useCallback((direction: "up" | "down") => {
    if (typeof window === "undefined") return;
    const delta = window.innerHeight * 0.8 * (direction === "up" ? -1 : 1);
    window.scrollBy({ top: delta, behavior: "smooth" });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setActiveStep((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(totalSteps, prev + 1));
  }, [totalSteps]);

  const canGoPrevious = activeStep > 1;
  const canGoNext = activeStep < totalSteps && canProceed();

  const handleSaveTemplate = (template: any) => {
    const customTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isCustom: true,
      name: `${template.name} (Personalizada)`,
    };
    setUserTemplates((prev) => [...prev, customTemplate]);
  };

  const handleAddComment = (comment: any) => {
    const newComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      timestamp: new Date(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  const handleResolveComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      )
    );
  };

  const handleRevertVersion = (versionId: string) => {
    console.log(`Reverting to version ${versionId}`);
    // Implementation for version revert
  };

  const handleAISuggestion = (suggestion: any) => {
    console.log("AI Suggestion:", suggestion);
    // Handle different types of AI suggestions
    switch (suggestion.type) {
      case "style-suggestions":
        // Apply color palette suggestions
        break;
      case "ai-cover":
        updateBookData({ coverImage: suggestion.data.image });
        break;
      case "text-rewrite":
        // Apply text improvements
        break;
    }
  };

  const progressPercentage = (activeStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold font-serif">AncloraPress</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                {mounted ? t('tagline') : 'Tu productividad, bien anclada'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {mounted ? t('button.preview') : 'Vista Previa'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExport(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                {mounted ? t('button.export') : 'Exportar'}
              </Button>
              <div className="border-l border-border mx-2" />
              <ThemeLanguageControls />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{mounted ? t('progress.title') : 'Progreso del Libro'}</h2>
            <span className="text-sm text-muted-foreground">
              {mounted ? t('progress.step') : 'Paso'} {activeStep} {mounted ? t('progress.of') : 'de'} {steps.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6 overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center cursor-pointer group"
                onClick={() => setActiveStep(step.id)}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${
                      step.status === "completed"
                        ? "bg-primary text-primary-foreground"
                        : step.status === "active"
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    }
                  `}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto" ref={contentRef}>
          {/* Step Content */}
          <div className="mb-8">
            <Card className="surface-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {mounted && steps.length > 0 && React.createElement(steps[activeStep - 1].icon, {
                      className: "w-4 h-4 text-primary",
                    })}
                  </div>
                  <span className="font-serif">
                    {mounted && steps.length > 0 ? steps[activeStep - 1].title : ''}
                  </span>
                </CardTitle>
                <CardDescription>
                  {mounted && steps.length > 0 ? steps[activeStep - 1].description : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeStep === 1 && (
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">{mounted ? t('editor.basic') : 'Básico'}</TabsTrigger>
                      <TabsTrigger value="advanced">{mounted ? t('editor.advanced') : 'Avanzado'}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic">
                      <TextEditor
                        content={bookData.content}
                        onChange={(content) => updateBookData({ content })}
                        title={bookData.title}
                        subtitle={bookData.subtitle}
                        author={bookData.author}
                        onMetadataChange={(metadata) =>
                          updateBookData({
                            title: metadata.title,
                            subtitle: metadata.subtitle,
                            author: metadata.author,
                          })
                        }
                        onChaptersDetected={handleImportedChapters}
                      />
                    </TabsContent>
                    <TabsContent value="advanced">
                      <EnhancedTextEditor
                        content={bookData.content}
                        onChange={(content) => updateBookData({ content })}
                        title={bookData.title}
                        subtitle={bookData.subtitle}
                        author={bookData.author}
                        onMetadataChange={(metadata) =>
                          updateBookData({
                            title: metadata.title,
                            subtitle: metadata.subtitle,
                            author: metadata.author,
                          })
                        }
                        onChaptersDetected={handleImportedChapters}
                      />
                    </TabsContent>
                  </Tabs>
                )}
                {activeStep === 2 && (
                  <ChapterEditor
                    chapters={bookData.chapters || []}
                    onChaptersChange={(chapters) =>
                      updateBookData({ chapters })
                    }
                    onChapterSelect={(chapter) => setSelectedChapter(chapter)}
                    selectedChapter={selectedChapter}
                  />
                )}
                {activeStep === 3 && (
                  <TemplateGallery
                    selectedTemplate={bookData.template}
                    onTemplateSelect={(template) =>
                      updateBookData({ template })
                    }
                    userTemplates={userTemplates}
                    onSaveTemplate={handleSaveTemplate}
                  />
                )}
                {activeStep === 4 && (
                  <CoverEditor
                    title={bookData.title}
                    author={bookData.author}
                    coverColor={bookData.coverColor}
                    coverImage={bookData.coverImage}
                    onCoverChange={(coverImage) =>
                      updateBookData({ coverImage })
                    }
                    onColorChange={(coverColor) =>
                      updateBookData({ coverColor })
                    }
                  />
                )}
                {activeStep === 5 && (
                  <BackCoverEditor
                    title={bookData.title}
                    author={bookData.author}
                    coverColor={bookData.coverColor}
                    coverImage={bookData.coverImage}
                    backCoverData={bookData.backCoverData}
                    onBackCoverChange={(backCoverData) =>
                      updateBookData({ backCoverData })
                    }
                    onColorChange={(coverColor) =>
                      updateBookData({ coverColor })
                    }
                    onImageChange={(coverImage) =>
                      updateBookData({ coverImage })
                    }
                  />
                )}
                {activeStep === 6 && (
                  <div className="text-center py-12">
                    <Monitor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {mounted ? t('preview.title') : 'Vista Previa del Libro'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {mounted ? t('preview.subtitle') : 'Revisa cómo se verá tu libro antes de publicarlo'}
                    </p>
                    <Button onClick={() => setShowPreview(true)} size="lg">
                      <Eye className="w-4 h-4 mr-2" />
                      {mounted ? t('preview.button') : 'Abrir Vista Previa'}
                    </Button>
                  </div>
                )}
                {activeStep === 7 && (
                  <CollaborationPanel
                    collaborators={collaborators}
                    comments={comments}
                    versions={versions}
                    onAddComment={handleAddComment}
                    onResolveComment={handleResolveComment}
                    onRevertVersion={handleRevertVersion}
                  />
                )}
                {activeStep === 8 && (
                  <AICopilot
                    content={bookData.content}
                    onSuggestion={handleAISuggestion}
                    bookData={bookData}
                    onUpdateBookData={updateBookData}
                  />
                )}
                {activeStep === 9 && (
                  <div className="text-center py-12">
                    <Download className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {mounted ? t('export.title') : 'Exportar tu libro'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {mounted ? t('export.subtitle') : 'Tu libro está listo para ser exportado en diferentes formatos'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                      <Card
                        className="surface-2 cursor-pointer hover:surface-3 transition-colors"
                        onClick={() => setShowExport(true)}
                      >
                        <CardContent className="p-6 text-center">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium">PDF</h4>
                          <p className="text-sm text-muted-foreground">
                            {mounted ? t('export.pdf') : 'Formato ideal para impresión'}
                          </p>
                        </CardContent>
                      </Card>
                      <Card
                        className="surface-2 cursor-pointer hover:surface-3 transition-colors"
                        onClick={() => setShowExport(true)}
                      >
                        <CardContent className="p-6 text-center">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium">EPUB</h4>
                          <p className="text-sm text-muted-foreground">
                            {mounted ? t('export.epub') : 'Formato estándar para ebooks'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      {mounted && (
        <FloatingNavigator
          canScrollUp={scrollState.canScrollUp}
          canScrollDown={scrollState.canScrollDown}
          onScrollUp={() => scrollByViewport("up")}
          onScrollDown={() => scrollByViewport("down")}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          rightOffset={navigatorOffset}
        />
      )}

      {/* Modals */}
      {showPreview && (
        <PreviewModal
          bookData={bookData}
          onClose={() => setShowPreview(false)}
        />
      )}
      {showExport && (
        <ExportModal bookData={bookData} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
