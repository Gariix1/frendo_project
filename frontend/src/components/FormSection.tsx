import { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function FormSection({ title, description, action, children, className = '' }: Props) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-white/70">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

