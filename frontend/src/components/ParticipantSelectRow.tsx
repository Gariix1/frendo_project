type Props = {
  name: string
  active: boolean
  checked: boolean
  onToggle: (checked: boolean) => void
}

export default function ParticipantSelectRow({ name, active, checked, onToggle }: Props) {
  return (
    <label className={`flex items-center gap-2 px-2 py-1 rounded-2xl border border-white/15 bg-white/5 ${active ? '' : 'opacity-60'}`}>
      <input type="checkbox" disabled={!active} checked={checked} onChange={e => onToggle(e.target.checked)} />
      <span>{name}</span>
    </label>
  )
}

