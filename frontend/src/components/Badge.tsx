type Props = {
  color?: 'primary' | 'light' | 'accent' | 'neutral'
  children: React.ReactNode
  subtleBorder?: boolean
}

export default function Badge({ color = 'neutral', subtleBorder = true, children }: Props) {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium'
  const styles =
    color === 'primary'
      ? `bg-primary text-black ${subtleBorder ? 'border border-black/10' : ''}`
      : color === 'light'
      ? `bg-light text-textbase ${subtleBorder ? 'border border-black/10' : ''}`
      : color === 'accent'
      ? `bg-accent/90 text-white ${subtleBorder ? 'border border-white/10' : ''}`
      : `bg-white/10 text-slate-100 ${subtleBorder ? 'border border-white/10' : ''}`

  return <span className={`${base} ${styles}`}>{children}</span>
}

