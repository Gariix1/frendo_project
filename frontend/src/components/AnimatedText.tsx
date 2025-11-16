import { PropsWithChildren, useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'

type Props = PropsWithChildren<{
  watch?: string | number
  className?: string
}>

export default function AnimatedText({ watch, className = '', children }: Props) {
  const { locale } = useI18n()
  const [current, setCurrent] = useState<{ id: string | number; content: React.ReactNode } | null>(null)
  const [prev, setPrev] = useState<{ id: string | number; content: React.ReactNode } | null>(null)
  const derivedKey = `${String(watch ?? '')}-${locale}`

  useEffect(() => {
    setPrev(current)
    setCurrent({ id: derivedKey, content: children })
  }, [children, derivedKey])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {prev && prev.id !== current?.id && (
        <span key={`prev-${String(prev.id)}`} className="block animate-fadeOut text-inherit">
          {prev.content}
        </span>
      )}
      {current && (
        <span key={`curr-${String(current.id)}`} className="block animate-fadeIn text-inherit">
          {current.content}
        </span>
      )}
    </div>
  )
}
