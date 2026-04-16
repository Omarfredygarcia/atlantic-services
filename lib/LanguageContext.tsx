'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { translations, Language, Translations } from './i18n'

interface LanguageContextType {
  lang: Language
  t: Translations
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: translations.en,
  toggleLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    const savedLang = localStorage.getItem('atlantic_lang') as Language | null
    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('atlantic_lang', lang)
  }, [lang])

  const toggleLang = () => setLang(prev => prev === 'en' ? 'es' : 'en')

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)