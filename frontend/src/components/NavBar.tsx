import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
    const hideThreshold = 140
    lastY.current = window.scrollY || 0
    const onScroll = () => {
      if (raf.current) return
      raf.current = window.requestAnimationFrame(() => {
        const y = window.scrollY || 0
        const dy = y - lastY.current
        // Show when near top or scrolling up; hide when scrolling down past threshold
        if (y < 48) {
          setHidden(false)
        } else if (dy > 10 && y > hideThreshold) {
          setHidden(true)
        } else if (dy < -10) {
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
  const {
    highlight: desktopHighlight,
    containerRef: desktopContainerRef,
    registerItem: registerDesktopItem,
  } = useSlidingHighlight(activeKey)
  const {
    highlight: mobileHighlight,
    containerRef: mobileContainerRef,
    registerItem: registerMobileItem,
  } = useSlidingHighlight(activeKey)

  const desktopWrapperRef = useRef<HTMLDivElement | null>(null)
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null)

  const updateOffsets = useCallback(() => {
    if (typeof document === 'undefined') return
    const topHeight = desktopWrapperRef.current?.getBoundingClientRect().height ?? 0
    const bottomHeight = mobileWrapperRef.current?.getBoundingClientRect().height ?? 0
    document.documentElement.style.setProperty('--nav-top-offset', `${topHeight}px`)
    document.documentElement.style.setProperty('--nav-bottom-offset', `${bottomHeight}px`)
  }, [])

  useEffect(() => {
    updateOffsets()
    window.addEventListener('resize', updateOffsets)
    return () => {
      window.removeEventListener('resize', updateOffsets)
    }
  }, [updateOffsets])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const observers: ResizeObserver[] = []
    const addObserver = (target: HTMLElement | null) => {
      if (!target) return
      const observer = new ResizeObserver(() => updateOffsets())
      observer.observe(target)
      observers.push(observer)
    }
    addObserver(desktopWrapperRef.current)
    addObserver(mobileWrapperRef.current)
    return () => observers.forEach(observer => observer.disconnect())
  }, [updateOffsets])

  const renderDesktopLink = (item: { to: string; label: string }) => {
    const isActive = pathname === item.to
    return (
      <Link
        key={item.to}
        to={item.to}
        ref={registerDesktopItem(item.to)}
        aria-current={isActive ? 'page' : undefined}
        className={`relative z-10 px-3 py-1.5 rounded-full font-semibold text-sm transition-colors duration-300 ${
          isActive
            ? 'text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]'
            : 'text-white/80 hover:text-white'
        }`}
      >
        <AnimatedText watch={item.label}>{item.label}</AnimatedText>
      </Link>
    )
  }

  const renderMobileLink = (item: { to: string; label: string }) => {
    const isActive = pathname === item.to
    return (
      <Link
        key={`mobile-${item.to}`}
        to={item.to}
        ref={registerMobileItem(item.to)}
        aria-current={isActive ? 'page' : undefined}
        className={`relative z-10 flex-1 text-center text-xs font-semibold py-2 transition-colors ${
          isActive ? 'text-slate-950' : 'text-white/70'
        }`}
      >
        <AnimatedText watch={`mobile-${item.label}`}>{item.label}</AnimatedText>
      </Link>
    )
  }

  return (
    <>
      <div
        ref={desktopWrapperRef}
        className={`hidden sm:block fixed top-0 inset-x-0 z-40 transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="max-w-3xl mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl px-3 sm:px-4 py-2 flex items-center justify-between">
            <Link to="/" className="font-semibold tracking-wide">
              <AnimatedText watch={t('brand.title')}>{t('brand.title')}</AnimatedText>
            </Link>
            <nav ref={desktopContainerRef} className="relative flex items-center gap-1 sm:gap-2 text-sm whitespace-nowrap overflow-hidden">
              {desktopHighlight && (
                <span
                  className="absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-br from-[#f8faff] via-[#e3e9ff] to-[#cfd7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_25px_rgba(13,21,45,0.4)] transition-all duration-300 ease-out"
                  style={{ width: `${desktopHighlight.width}px`, transform: `translateX(${desktopHighlight.left}px)` }}
                  aria-hidden
                />
              )}
              {navItems.map(item => renderDesktopLink(item))}
              <div className="ml-2">
                <LanguageSwitcher value={locale} onChange={setLocale as (locale: 'es' | 'en') => void} />
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div
        ref={mobileWrapperRef}
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-3">
          <nav ref={mobileContainerRef} className="relative flex-1 flex items-center gap-1 overflow-hidden">
            {mobileHighlight && (
              <span
                className="absolute inset-y-1 rounded-xl bg-gradient-to-r from-white/80 to-white/60 shadow-[0_5px_18px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out"
                style={{ width: `${mobileHighlight.width}px`, transform: `translateX(${mobileHighlight.left}px)` }}
                aria-hidden
              />
            )}
            {navItems.map(item => renderMobileLink(item))}
          </nav>
          <LanguageSwitcher
            value={locale}
            onChange={setLocale as (locale: 'es' | 'en') => void}
            className="!min-w-[80px] text-[11px]"
          />
        </div>
      </div>
    </>
  )
}
