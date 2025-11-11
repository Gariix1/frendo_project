import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

export default function NavBar() {
  const { pathname } = useLocation()
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
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-xl transition-colors ${
        pathname === to
          ? 'bg-white/20 text-white'
          : 'text-slate-100/90 hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className={`fixed top-0 inset-x-0 z-40 transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-3xl mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl px-3 sm:px-4 py-2 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-wide">Secret Friend</Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto whitespace-nowrap">
            {link('/', 'Create')}
            {link('/admin', 'Admin')}
          </nav>
        </div>
      </div>
    </div>
  )
}
