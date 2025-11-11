import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
    : 'bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
