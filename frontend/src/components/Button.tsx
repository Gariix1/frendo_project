import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'accent' }

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none'
  let styles = ''
  if (variant === 'primary') {
    styles = 'bg-primary hover:bg-[#74BA00] text-black shadow-[0_0_0_1px_rgba(127,206,0,0.15)] focus:ring-2 focus:ring-[#7FCE00]/40'
  } else if (variant === 'accent') {
    styles = 'bg-accent hover:bg-[#A94444] text-white shadow-[0_0_0_1px_rgba(188,76,76,0.15)] focus:ring-2 focus:ring-[#BC4C4C]/40'
  } else {
    styles = 'bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 focus:ring-2 focus:ring-white/20'
  }
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
