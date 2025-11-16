import { InputHTMLAttributes, forwardRef } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { full?: boolean }

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', full = true, ...props }, ref
) {
  const base = 'px-3 py-2 rounded-xl bg-white/10 border border-light/30 text-slate-100 placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50'
  return (
    <input ref={ref} className={`${base} ${full ? 'w-full' : ''} ${className}`} {...props} />
  )
})

export default Input

