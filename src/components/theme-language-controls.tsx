'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguageContext } from '@/contexts/language-context'

type Theme = 'light' | 'dark'

export function ThemeLanguageControls() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)
  const { language, setLanguage } = useLanguageContext()

  useEffect(() => {
    setMounted(true)
    applyTheme('dark')
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const htmlElement = document.documentElement
    htmlElement.classList.toggle('dark', newTheme === 'dark')
  }

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es'
    setLanguage(newLanguage)
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        title={`Tema: ${theme}`}
        className="px-2"
      >
        {theme === 'light' && <Sun className="w-4 h-4" />}
        {theme === 'dark' && <Moon className="w-4 h-4" />}
      </Button>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="px-2 font-medium text-xs"
        title={`Idioma: ${language === 'es' ? 'Español' : 'English'}`}
      >
        {language === 'es' ? 'EN' : 'ES'}
      </Button>
    </div>
  )
}
