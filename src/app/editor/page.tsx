/**
 * Editor Page
 * Main MVP editor interface using EditorWorkspace
 */

import EditorWorkspace from "@/components/editor-workspace"

export const metadata = {
  title: "Editor - Anclora Press",
  description: "Edita tus documentos con auto-guardado local",
}

export default function EditorPage() {
  return <EditorWorkspace />
}
