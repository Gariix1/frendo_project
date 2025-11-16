import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { api } from '../lib/api'
import { useI18n } from '../i18n/I18nProvider'
import { validationRules } from '../lib/validation'

type Person = { id: string; name: string; active: boolean }

type SelectionResult = {
  ids: string[]
  people: { id: string; name: string }[]
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (selection: SelectionResult) => void
  initialSelected?: string[]
}

export default function PeoplePicker({ open, onClose, onConfirm, initialSelected = [] }: Props) {
  const { t } = useI18n()
  const [people, setPeople] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    (async () => { try { setPeople(await api.listPeople()) } catch {} })()
  }, [])

  useEffect(() => {
    if (!open) return
    const sel: Record<string, boolean> = {}
    ;(initialSelected || []).forEach(id => { if (id) sel[id] = true })
    setSelected(sel)
  }, [open, initialSelected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter(p => p.name.toLowerCase().includes(q))
  }, [people, query])

  const count = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])
  const minParticipants = validationRules.game.minParticipants

  return (
    <Modal open={open} onClose={onClose} title={t('peoplePicker.title')}>
      <input
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-light/30 text-slate-100 placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
        placeholder={t('peoplePicker.searchPlaceholder')} value={query} onChange={e=>setQuery(e.target.value)}
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
        {filtered.length === 0 && <div className="text-sm text-slate-300">{t('peoplePicker.noResults')}</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{t('common.selectedCount', { count })}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button
            onClick={() => {
              const selectedPeople = people.filter(p => selected[p.id])
              onConfirm({
                ids: selectedPeople.map(p => p.id),
                people: selectedPeople.map(p => ({ id: p.id, name: p.name })),
              })
            }}
            disabled={count < minParticipants}
          >
            {t('buttons.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
