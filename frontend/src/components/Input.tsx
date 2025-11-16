import { InputHTMLAttributes, forwardRef } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { full?: boolean }

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', full = true, ...props }, ref
) {
  const base =
    'px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-slate-50 placeholder:text-slate-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_25px_rgba(2,6,23,0.35)] focus:outline-none focus:ring-2 focus:ring-[#9BFF3D]/40 focus:border-[#9BFF3D]/60'
  return (
    <input ref={ref} className={`${base} ${full ? 'w-full' : ''} ${className}`} {...props} />
  )
})

export default Input
