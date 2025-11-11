import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { api } from '../lib/api'

type Person = { id: string; name: string; active: boolean }

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (ids: string[]) => void
  initialSelected?: string[]
}

export default function PeoplePicker({ open, onClose, onConfirm, initialSelected = [] }: Props) {
  const [people, setPeople] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    (async () => { try { setPeople(await api.listPeople()) } catch {} })()
  }, [])

  useEffect(() => {
    const sel: Record<string, boolean> = {}
    initialSelected.forEach(id => sel[id] = true)
    setSelected(sel)
  }, [initialSelected, open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter(p => p.name.toLowerCase().includes(q))
  }, [people, query])

  const count = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])

  return (
    <Modal open={open} onClose={onClose} title="Pick Participants">
      <input
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none"
        placeholder="Search people" value={query} onChange={e=>setQuery(e.target.value)}
      />
      <div className="max-h-80 overflow-auto rounded-2xl border border-white/20 p-2 bg-white/5">
        {filtered.map(p => (
          <label key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-xl ${p.active ? '' : 'opacity-60'}`}>
            <input type="checkbox" disabled={!p.active}
              checked={!!selected[p.id]}
              onChange={e=> setSelected(prev => ({ ...prev, [p.id]: e.target.checked }))}
            />
            <span>{p.name}</span>
          </label>
        ))}
        {filtered.length === 0 && <div className="text-sm text-slate-300">No results.</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Selected: {count}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(Object.keys(selected).filter(id => selected[id]))} disabled={count < 3}>Confirm</Button>
        </div>
      </div>
    </Modal>
  )
}

