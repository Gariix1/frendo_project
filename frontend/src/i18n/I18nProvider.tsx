import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import es from './es.json'
import en from './en.json'

type Locale = 'es' | 'en'
type Dict = Record<string, string>

type I18nContextType = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const catalogs: Record<Locale, Dict> = { es, en }

const I18nContext = createContext<I18nContextType | null>(null)

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

export default function I18nProvider({ children }: PropsWithChildren) {
  const detect = (): Locale => {
    try {
      const saved = localStorage.getItem('locale') as Locale | null
      if (saved === 'es' || saved === 'en') return saved
    } catch {}
    const nav = (navigator.language || 'es').toLowerCase()
    return nav.startsWith('es') ? 'es' : 'en' // default to ES if locale not ES
  }

  const [locale, setLocaleState] = useState<Locale>(detect())

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('locale', l) } catch {}
  }, [])

  const dict = useMemo(() => catalogs[locale] || catalogs.es, [locale])

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const raw = dict[key] || key
    return interpolate(raw, params)
  }, [dict])

  useEffect(() => {
    // ensure body lang attribute for a11y
    try { document.documentElement.lang = locale } catch {}
  }, [locale])

  const value = useMemo<I18nContextType>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
