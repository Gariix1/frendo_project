import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'accent' }

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'
  let styles = ''
  if (variant === 'primary') {
    styles =
      'text-slate-950 bg-gradient-to-br from-[#b4ff4c] via-[#9BFF3D] to-[#74C000] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_20px_40px_rgba(127,206,0,0.5)] hover:shadow-[inset_0_3px_0_rgba(255,255,255,0.85),0_28px_55px_rgba(127,206,0,0.65)] hover:-translate-y-0.5'
  } else if (variant === 'accent') {
    styles =
      'text-white bg-gradient-to-br from-[#FF8A8A] via-[#FF6B6B] to-[#C44747] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_18px_36px_rgba(188,76,76,0.55)] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_26px_48px_rgba(188,76,76,0.7)] hover:-translate-y-0.5'
  } else {
    styles =
      'text-slate-100 border border-white/15 bg-gradient-to-br from-white/12 to-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_28px_rgba(2,6,23,0.6)] hover:bg-white/20 hover:-translate-y-0.5'
  }
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
