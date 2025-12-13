"use client"

/**
 * PDF Export Dialog
 * Configurable PDF export with Paged.js preview
 */

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, Loader2 } from "lucide-react"
import { generatePrintableHTML, EXPORT_PRESETS, PDFExportOptions } from "@/lib/pdf-export"

interface PDFExportDialogProps {
  isOpen: boolean
  onClose: () => void
  content: string
  title?: string
  author?: string
}

export default function PDFExportDialog({
  isOpen,
  onClose,
  content,
  title = "Untitled",
  author = "Author",
}: PDFExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [options, setOptions] = useState<PDFExportOptions>({
    title,
    author,
    pageSize: "6x9",
    theme: "classic",
    includePageNumbers: true,
    includeHeaders: true,
  })

  const handlePreset = (presetName: keyof typeof EXPORT_PRESETS) => {
    const preset = EXPORT_PRESETS[presetName]
    setOptions((prev) => ({
      ...prev,
      ...preset,
    }))
  }

  const handleExportPDF = async () => {
    setIsExporting(true)

    try {
      // Generate printable HTML
      const html = generatePrintableHTML(content, options)

      // Create blob and download
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)

      // Open in new window for printing
      const printWindow = window.open(url, "_blank")

      if (printWindow) {
        // Wait for page to load, then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()

            // Clean up after print dialog closes
            setTimeout(() => {
              URL.revokeObjectURL(url)
              printWindow.close()
            }, 100)
          }, 500)
        }
      }

      onClose()
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export to PDF
          </DialogTitle>
          <DialogDescription>
            Configure your PDF settings and export using Paged.js for
            perfect fidelity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Presets */}
          <div className="space-y-3">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EXPORT_PRESETS).map(([name]) => (
                <Button
                  key={name}
                  variant={
                    options.pageSize ===
                    EXPORT_PRESETS[name as keyof typeof EXPORT_PRESETS]
                      .pageSize
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    handlePreset(name as keyof typeof EXPORT_PRESETS)
                  }
                  className="capitalize"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Document Metadata */}
          <div className="space-y-3 border-t pt-6">
            <Label>Document Details</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">
                  Title
                </Label>
                <Input
                  id="title"
                  value={options.title}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Book Title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm">
                  Author
                </Label>
                <Input
                  id="author"
                  value={options.author}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      author: e.target.value,
                    }))
                  }
                  placeholder="Author Name"
                />
              </div>
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-3 border-t pt-6">
            <Label>Layout Options</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageSize" className="text-sm">
                  Page Size
                </Label>
                <Select
                  value={options.pageSize}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      pageSize: value as PDFExportOptions["pageSize"],
                    }))
                  }
                >
                  <SelectTrigger id="pageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6x9">6" × 9" (Novel)</SelectItem>
                    <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
                    <SelectItem value="a5">A5 (148mm × 210mm)</SelectItem>
                    <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm">
                  Theme
                </Label>
                <Select
                  value={options.theme}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      theme: value as PDFExportOptions["theme"],
                    }))
                  }
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pageNumbers"
                  checked={options.includePageNumbers}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includePageNumbers: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="pageNumbers" className="text-sm font-normal">
                  Include Page Numbers
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="headers"
                  checked={options.includeHeaders}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeHeaders: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="headers" className="text-sm font-normal">
                  Include Headers
                </Label>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6 text-sm text-blue-900">
              <p>
                <strong>Paged.js Export:</strong> This export uses the W3C
                Paged Media standard. The preview and printed output will be
                identical, ensuring 100% fidelity between what you see and what
                you print.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewMode(!previewMode)
              }}
            >
              {previewMode ? "Hide Preview" : "Preview"}
            </Button>

            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Open Print Dialog
                </>
              )}
            </Button>

            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Preview Info */}
          {previewMode && (
            <div className="bg-muted/30 rounded p-4 text-sm text-muted-foreground">
              <p>
                Click "Open Print Dialog" to see a full preview and export your
                PDF. You can customize print settings in the print dialog before
                saving to PDF.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
