import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import LanguageSwitcher from './LanguageSwitcher'
import AnimatedText from './AnimatedText'
import { useSlidingHighlight } from '../animations/useSlidingHighlight'

export default function NavBar() {
  const { pathname } = useLocation()
  const { t, locale, setLocale } = useI18n()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef<number>(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    lastY.current = window.scrollY || 0
    const onScroll = () => {
      if (raf.current) return
      raf.current = window.requestAnimationFrame(() => {
        const y = window.scrollY || 0
        const dy = y - lastY.current
        // Show when near top or scrolling up; hide when scrolling down past threshold
        if (y < 24) {
          setHidden(false)
        } else if (dy > 6 && y > 64) {
          setHidden(true)
        } else if (dy < -6) {
          setHidden(false)
        }
        lastY.current = y
        raf.current = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])
  const navItems = useMemo(() => [
    { to: '/', label: t('nav.create') },
    { to: '/admin', label: t('nav.admin') },
  ], [t])

  const activeKey = useMemo(() => navItems.find(item => item.to === pathname)?.to ?? null, [navItems, pathname])
  const { highlight, containerRef, registerItem } = useSlidingHighlight(activeKey)

  const link = (item: { to: string; label: string }) => (
    <Link
      key={item.to}
      to={item.to}
      ref={registerItem(item.to)}
      className={`relative z-10 px-3 py-1.5 rounded-full font-semibold text-sm transition-colors duration-300 ${
        pathname === item.to
          ? 'text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]'
          : 'text-white/80 hover:text-white'
      }`}
    >
      <AnimatedText watch={item.label}>{item.label}</AnimatedText>
    </Link>
  )

  return (
    <div className={`fixed top-0 inset-x-0 z-40 transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-3xl mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl px-3 sm:px-4 py-2 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-wide">
            <AnimatedText watch={t('brand.title')}>{t('brand.title')}</AnimatedText>
          </Link>
          <nav ref={containerRef} className="relative flex items-center gap-1 sm:gap-2 text-sm whitespace-nowrap overflow-hidden">
            {highlight && (
              <span
                className="absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-br from-[#f8faff] via-[#e3e9ff] to-[#cfd7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_25px_rgba(13,21,45,0.4)] transition-all duration-300 ease-out"
                style={{ width: `${highlight.width}px`, transform: `translateX(${highlight.left}px)` }}
                aria-hidden
              />
            )}
            {navItems.map(item => link(item))}
            <div className="ml-2">
              <LanguageSwitcher value={locale} onChange={setLocale as (locale: 'es' | 'en') => void} />
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
