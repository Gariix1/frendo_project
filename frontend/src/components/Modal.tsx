import { PropsWithChildren } from 'react'

type Variant = 'default' | 'primary' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

type Props = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  variant?: Variant
  size?: Size
}>

const variantStyles: Record<Variant, string> = {
  default: 'border-white/20 bg-white/10 shadow-[0_25px_80px_rgba(5,8,22,0.6)]',
  primary: 'border-primary/30 bg-primary/10 shadow-[0_25px_80px_rgba(127,206,0,0.25)]',
  danger: 'border-accent/40 bg-accent/10 shadow-[0_25px_80px_rgba(188,76,76,0.35)]',
  success: 'border-[#7FCE00]/40 bg-[#7FCE00]/10 shadow-[0_25px_80px_rgba(127,206,0,0.35)]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, description, variant = 'default', size = 'md', children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${sizeStyles[size]} rounded-[28px] backdrop-blur-2xl p-5 sm:p-6 ${variantStyles[variant]}`}>
          {title && <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>}
          {description && <p className="text-sm text-white/70 mb-3">{description}</p>}
          <div className="space-y-4 text-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
