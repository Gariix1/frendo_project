import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  className?: string
}

export default function CardSurface({ children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/5 ${className}`}>
      {children}
    </div>
  )
}

