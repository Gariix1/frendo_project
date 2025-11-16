import { ReactNode } from 'react'

type Props = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  visual?: ReactNode
  className?: string
}

export default function HeroCard({ eyebrow, title, description, actions, visual, className = '' }: Props) {
  return (
    <section className={`hero-card p-8 ${className}`}>
      <div className="hero-card__content space-y-4 max-w-2xl">
        {eyebrow && <p className="text-sm uppercase tracking-[0.4em] text-white/70">{eyebrow}</p>}
        <h1 className="text-4xl md:text-5xl font-semibold text-white drop-shadow-lg">{title}</h1>
        {description && <p className="text-base md:text-lg text-white/80">{description}</p>}
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      <div className="hero-card__visual" aria-hidden>
        {visual}
      </div>
    </section>
  )
}
