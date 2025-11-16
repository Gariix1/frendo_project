import AnimatedText from './AnimatedText'

type Props = {
  label: string
  onRemove?: () => void
  removeLabel?: string
  className?: string
}

export default function Chip({ label, onRemove, removeLabel, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-slate-100 ${className}`}>
      <span className="truncate">
        <AnimatedText watch={label}>{label}</AnimatedText>
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-xs text-slate-200 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <span aria-hidden>&times;</span>
            <span className="sr-only">{removeLabel || label}</span>
          </button>
      )}
    </span>
  )
}
