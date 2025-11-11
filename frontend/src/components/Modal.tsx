import { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
}>

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-5">
          {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

