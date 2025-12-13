"use client"

/**
 * DocumentImporter Component
 * Handles DOCX/document file imports with semantic mapping
 */

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentImporterProps {
  onImportSuccess?: (data: {
    title: string
    content: string
    metadata: Record<string, any>
  }) => void
  onImportError?: (error: string) => void
  className?: string
}

export default function DocumentImporter({
  onImportSuccess,
  onImportError,
  className,
}: DocumentImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: "idle" | "loading" | "success" | "error"
    message: string
    details?: any
  }>({ type: "idle", message: "" })
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
      "application/pdf",
    ]

    const allowedExtensions = ["docx", "doc", "txt", "md", "pdf"]
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      const error = `Unsupported file format. Supported: ${allowedExtensions.join(", ")}`
      setImportStatus({ type: "error", message: error })
      onImportError?.(error)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      const error = `File too large. Maximum 50MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
      setImportStatus({ type: "error", message: error })
      onImportError?.(error)
      return
    }

    setIsImporting(true)
    setImportStatus({ type: "loading", message: "Importing document..." })

    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Create FormData and submit
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      // Success!
      setImportStatus({
        type: "success",
        message: "Document imported successfully!",
        details: data,
      })

      onImportSuccess?.({
        title: data.metadata?.title || file.name,
        content: data.content,
        metadata: data.metadata,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Import failed"
      setImportStatus({
        type: "error",
        message: errorMessage,
      })
      onImportError?.(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Document
          </CardTitle>
          <CardDescription>
            Upload a Word document, PDF, or text file to begin editing
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".docx,.doc,.txt,.md,.pdf"
              disabled={isImporting}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                {isImporting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <FileText className="h-6 w-6 text-primary" />
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="font-medium">
                  {isImporting ? "Importing..." : "Drag and drop your document"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to select from your computer
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {["DOCX", "DOC", "PDF", "TXT", "MD"].map((format) => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB (~300 pages)
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {importStatus.type === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}

          {importStatus.type === "success" && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {importStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Import Details */}
          {importStatus.type === "success" && importStatus.details && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Document Info</h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">{importStatus.details.metadata?.title || "N/A"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Pages</p>
                  <p className="font-medium">{importStatus.details.metadata?.pages || "0"}</p>
                </div>

                {importStatus.details.metadata?.wordCount && (
                  <div>
                    <p className="text-muted-foreground">Words</p>
                    <p className="font-medium">{importStatus.details.metadata.wordCount}</p>
                  </div>
                )}

                {importStatus.details.metadata?.headings && (
                  <div>
                    <p className="text-muted-foreground">Headings</p>
                    <p className="font-medium">{importStatus.details.metadata.headings}</p>
                  </div>
                )}
              </div>

              {importStatus.details.metadata?.warnings &&
                importStatus.details.metadata.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      Import Warnings
                    </p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      {importStatus.details.metadata.warnings.map(
                        (warning: string, idx: number) => (
                          <li key={idx}>• {warning}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </>
              )}
            </Button>

            {importStatus.type === "success" && (
              <Button
                variant="outline"
                onClick={() => {
                  setImportStatus({ type: "idle", message: "" })
                  fileInputRef.current?.click()
                }}
              >
                Import Another
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-900">
              <strong>Tip:</strong> Documents are converted using semantic
              structure mapping. Word styles are automatically converted to
              proper heading levels and paragraphs for consistent formatting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
