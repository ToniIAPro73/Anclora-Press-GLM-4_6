'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'
type Language = 'es' | 'en'

export function ThemeLanguageControls() {
  const [theme, setTheme] = useState<Theme>('light')
  const [language, setLanguage] = useState<Language>('es')
  const [mounted, setMounted] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true)
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light'
    const savedLanguage = (localStorage.getItem('language') as Language) || 'es'

    setTheme(savedTheme)
    setLanguage(savedLanguage)
    applyTheme(savedTheme)
    applyLanguage(savedLanguage)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const htmlElement = document.documentElement

    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      htmlElement.classList.toggle('dark', prefersDark)
    } else {
      htmlElement.classList.toggle('dark', newTheme === 'dark')
    }

    localStorage.setItem('theme', newTheme)
  }

  const applyLanguage = (newLanguage: Language) => {
    localStorage.setItem('language', newLanguage)
    document.documentElement.lang = newLanguage
  }

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es'
    setLanguage(newLanguage)
    applyLanguage(newLanguage)
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
        {theme === 'system' && <Monitor className="w-4 h-4" />}
      </Button>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="px-2 font-medium text-xs"
      >
        {language === 'es' ? 'ES' : 'EN'} | {language === 'es' ? 'EN' : 'ES'}
      </Button>
    </div>
  )
}
