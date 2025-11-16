type Variant = 'active' | 'inactive' | 'revealed'

type Props = {
  label: string
  variant: Variant
}

const variantClasses: Record<Variant, string> = {
  active: 'text-[#2b3a13] bg-[#b6ff5d] border-[#9dd443]',
  inactive: 'text-white bg-white/15 border-white/20',
  revealed: 'text-[#3f1a06] bg-[#ffd9a1] border-[#f5b974]',
}

export default function StatusBadge({ label, variant }: Props) {
  const styles = variantClasses[variant]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  )
}

