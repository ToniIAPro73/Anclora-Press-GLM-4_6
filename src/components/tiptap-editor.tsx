"use client"

/**
 * TiptapEditor Component
 * Main editor for Anclora Press using Tiptap
 * Features: Semantic text editing, auto-save, full control
 */

import React, { useCallback, useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import TextStyle from "@tiptap/extension-text-style"
import FontFamily from "@tiptap/extension-font-family"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: (content: string) => void
  placeholder?: string
  autosaveInterval?: number // ms
  className?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  return (
    <div className="bg-muted/50 border-b border-border p-3 flex flex-wrap gap-1">
      {/* Font Family Selection */}
      <select
        onChange={(e) => {
          const fontName = e.target.value
          if (fontName === 'reset') {
            editor.chain().focus().clearNodes().run()
          } else {
            editor.chain().focus().setFontFamily(fontName).run()
          }
        }}
        className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        title="Cambiar tipografía"
      >
        <option value="reset">Fuente por defecto</option>
        <option value="'Libre Baskerville', serif">Serif</option>
        <option value="'Playfair Display', serif">Playfair</option>
        <option value="'Lora', serif">Lora</option>
        <option value="'Merriweather', serif">Merriweather</option>
        <option value="'Crimson Text', serif">Crimson</option>
        <option value="'Cormorant Garamond', serif">Cormorant</option>
        <option value="'Inter', sans-serif">Sans</option>
        <option value="'Poppins', sans-serif">Poppins</option>
        <option value="'Raleway', sans-serif">Raleway</option>
        <option value="'Roboto', sans-serif">Roboto</option>
        <option value="'Montserrat', sans-serif">Montserrat</option>
        <option value="'Oswald', sans-serif">Oswald</option>
        <option value="'JetBrains Mono', monospace">Mono</option>
      </select>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Text Formatting */}
      <div className="flex gap-1">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Headings */}
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <Button
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            variant={
              editor.isActive("heading", { level }) ? "default" : "ghost"
            }
            size="sm"
            title={`Heading ${level}`}
          >
            {level === 1 && <Heading1 className="h-4 w-4" />}
            {level === 2 && <Heading2 className="h-4 w-4" />}
            {level === 3 && <Heading3 className="h-4 w-4" />}
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Lists */}
      <div className="flex gap-1">
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Blockquote and Code */}
      <div className="flex gap-1">
        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          variant={editor.isActive("codeBlock") ? "default" : "ghost"}
          size="sm"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* History */}
      <div className="flex gap-1">
        <Button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          variant="ghost"
          size="sm"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          variant="ghost"
          size="sm"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function TiptapEditor({
  content,
  onChange,
  onSave,
  placeholder = "Start writing...",
  autosaveInterval = 5000,
  className,
}: TiptapEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: 1000000, // 1M characters max
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  // Auto-save functionality
  useEffect(() => {
    if (!editor || !onSave) return

    const interval = setInterval(async () => {
      const html = editor.getHTML()
      setIsSaving(true)
      try {
        await onSave(html)
        setLastSaveTime(new Date())
      } catch (error) {
        console.error("Auto-save failed:", error)
      } finally {
        setIsSaving(false)
      }
    }, autosaveInterval)

    return () => clearInterval(interval)
  }, [editor, onSave, autosaveInterval])

  // Handle initial content
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [])

  if (!editor) {
    return <div className="text-center py-8">Loading editor...</div>
  }

  const wordCount = editor.storage.characterCount.words()
  const charCount = editor.storage.characterCount.characters()

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-lg border", className)}>
      {/* Menu Bar */}
      <MenuBar editor={editor} />

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none
            [&_.ProseMirror]:focus:outline-none
            [&_.ProseMirror]:text-base
            [&_.ProseMirror]:line-height-relaxed
          "
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-yellow-600">Saving...</span>}
          {lastSaveTime && !isSaving && (
            <span>
              Last saved: {lastSaveTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
