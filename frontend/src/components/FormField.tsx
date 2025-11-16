import { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor?: string
  helperText?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function FormField({ label, htmlFor, helperText, actions, children, className = '' }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-100">
          {label}
        </label>
        {actions}
      </div>
      {children}
      {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  )
}

