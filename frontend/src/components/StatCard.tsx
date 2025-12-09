import { ReactNode } from 'react'

type Variant = 'default' | 'highlight'

type Props = {
  label: ReactNode
  value: ReactNode
  helperText?: ReactNode
  variant?: Variant
}

const baseClasses = 'rounded-3xl p-4 shadow-lg space-y-1 border'

const variantClasses: Record<Variant, { container: string; label: string; helper: string }> = {
  default: {
    container: 'border-white/10 bg-white/5',
    label: 'text-white/60',
    helper: 'text-white/60',
  },
  highlight: {
    container: 'border-primary/30 bg-primary/10',
    label: 'text-primary/80',
    helper: 'text-white/80',
  },
}

export default function StatCard({ label, value, helperText, variant = 'default' }: Props) {
  const variantStyle = variantClasses[variant]
  return (
    <div className={`${baseClasses} ${variantStyle.container}`}>
      <p className={`text-sm uppercase tracking-wide ${variantStyle.label}`}>{label}</p>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {helperText && <p className={`text-xs ${variantStyle.helper}`}>{helperText}</p>}
    </div>
  )
}
