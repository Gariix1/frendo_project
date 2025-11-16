import { ReactNode } from 'react'
import AnimatedText from './AnimatedText'

type Props = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function SectionHeader({ title, description, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">
          <AnimatedText watch={title}>{title}</AnimatedText>
        </h2>
        {description && (
          <p className="text-sm text-white/70 max-w-2xl">
            <AnimatedText watch={description}>{description}</AnimatedText>
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
