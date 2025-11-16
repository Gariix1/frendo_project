import React from 'react'

type Locale = 'es' | 'en'

type Props = {
  value: Locale
  onChange: (locale: Locale) => void
}

const options: Locale[] = ['es', 'en']

export default function LanguageSwitcher({ value, onChange }: Props) {
  const toggle = () => onChange(value === 'es' ? 'en' : 'es')

  return (
    <div
      className="relative flex items-center gap-1 rounded-full border border-white/15 bg-gradient-to-br from-white/12 to-white/3 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.4)] min-w-[96px] cursor-pointer select-none"
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      role="group"
      tabIndex={0}
      aria-label="Language switch"
    >
      <div
        className="absolute top-0.5 bottom-0.5 w-[50%] rounded-full bg-gradient-to-br from-[#b4ff4c] via-[#9BFF3D] to-[#74C000] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_12px_25px_rgba(127,206,0,0.45)] transition-transform duration-300 ease-out"
        style={{ transform: value === 'en' ? 'translateX(100%)' : 'translateX(0)' }}
        aria-hidden
      />
      {options.map(locale => (
        <span
          key={locale}
          className={`relative z-10 flex-1 text-center text-xs font-semibold py-1 rounded-full transition-colors ${
            value === locale ? 'text-slate-950' : 'text-white/70'
          }`}
        >
          {locale.toUpperCase()}
        </span>
      ))}
    </div>
  )
}
