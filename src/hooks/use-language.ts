import { useCallback, useEffect, useState } from 'react'

type Language = 'es' | 'en'

const translations = {
  es: {
    'title': 'Anclora Press',
    'subtitle': 'Plataforma de Publishing Digital',
    'editor.title': 'Editor Avanzado',
    'editor.description': 'Herramientas profesionales para edición de contenido',
    'import.title': 'Importar Documento',
    'import.description': 'Importa contenido desde archivos existentes en el editor avanzado',
    'import.select': 'Seleccionar Archivo',
    'import.uploading': 'Importando documento...',
    'import.processing': 'Procesando el contenido del documento...',
    'import.dragdrop': 'Arrastra un archivo aquí o haz clic para seleccionar',
    'search.placeholder': 'Texto a buscar...',
    'replace.placeholder': 'Texto de reemplazo...',
    'search.button': 'Buscar',
    'replace.button': 'Reemplazar',
    'undo.title': 'Deshacer',
    'redo.title': 'Rehacer',
  },
  en: {
    'title': 'Anclora Press',
    'subtitle': 'Digital Publishing Platform',
    'editor.title': 'Advanced Editor',
    'editor.description': 'Professional content editing tools',
    'import.title': 'Import Document',
    'import.description': 'Import content from existing files in the advanced editor',
    'import.select': 'Select File',
    'import.uploading': 'Importing document...',
    'import.processing': 'Processing document content...',
    'import.dragdrop': 'Drag a file here or click to select',
    'search.placeholder': 'Search text...',
    'replace.placeholder': 'Replacement text...',
    'search.button': 'Search',
    'replace.button': 'Replace',
    'undo.title': 'Undo',
    'redo.title': 'Redo',
  },
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem('language') as Language) || 'es'
    setLanguage(saved)
  }, [])

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      if (!mounted) return defaultValue || key
      const translation = translations[language as Language][key as keyof typeof translations['es']]
      return translation || defaultValue || key
    },
    [language, mounted]
  )

  return { language, t, mounted }
}
