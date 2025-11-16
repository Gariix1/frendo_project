import { PropsWithChildren } from 'react'

type Alignment = 'start' | 'center' | 'end' | 'between'

type Props = PropsWithChildren<{
  align?: Alignment
  wrap?: boolean
  className?: string
}>

const alignClasses: Record<Alignment, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

export default function DialogActions({ align = 'end', wrap = false, className = '', children }: Props) {
  return (
    <div className={`flex gap-2 ${alignClasses[align]} ${wrap ? 'flex-wrap' : ''} ${className}`}>
      {children}
    </div>
  )
}
