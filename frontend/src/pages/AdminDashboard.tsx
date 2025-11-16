import { useEffect, useMemo, useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { api } from '../lib/api'
import { useModal } from '../components/ModalProvider'
import { useToast } from '../components/ToastProvider'
import Input from '../components/Input'
import PeoplePicker from '../components/PeoplePicker'
import Chip from '../components/Chip'
import FormField from '../components/FormField'
import { useI18n } from '../i18n/I18nProvider'

type Game = { game_id: string; title: string; created_at: string; any_revealed: boolean; active: boolean; participant_count: number }
type Person = { id: string; name: string; active: boolean }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { confirm } = useModal()
  const { success, error: toastError } = useToast()
  const { t } = useI18n()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwords, setPasswords] = useState<Record<string,string>>({})
  const [newTitle, setNewTitle] = useState(() => t('admin.newTitlePlaceholder'))
  const [newPassword, setNewPassword] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [masterPassword, setMasterPassword] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [masterError, setMasterError] = useState<string | null>(null)
  const titleFieldId = useId()
  const adminPasswordFieldId = useId()
  const masterPasswordFieldId = useId()
  const personNameFieldId = useId()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await api.listGames()
      setGames(list)
    } catch (err: any) {
      setError(err.message || t('errors.failedListGames'))
    } finally {
      setLoading(false)
    }
  }

  const selectedPeoplePreview = useMemo(
    () => selectedIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[],
    [selectedIds, people],
  )

  useEffect(() => { load() }, [])
  useEffect(() => { (async () => { try { setPeople(await api.listPeople()) } catch {} })() }, [])

  const toggleActive = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert(t('admin.enterPasswordPrompt')); return }
    setLoading(true)
    setError(null)
    try {
      await api.toggleGameActive(g.game_id, pw, !g.active)
      await load()
      success(g.active ? t('admin.deactivated') : t('admin.activated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedToggleGame')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const renameTitle = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert(t('admin.enterPasswordPrompt')); return }
    const title = prompt(t('admin.promptNewTitle'), g.title)
    if (!title || title.trim() === g.title) return
    setLoading(true)
    setError(null)
    try {
      await api.updateGameTitle(g.game_id, pw, title.trim())
      await load()
      success(t('admin.titleUpdated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedUpdateTitle')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const deleteGame = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert(t('admin.enterPasswordPrompt')); return }
    const ok = await confirm({
      title: t('admin.deleteConfirmTitle'),
      message: t('admin.deleteConfirmMessage', { title: g.title }),
      confirmText: t('admin.deleteConfirmCta')
    })
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      await api.deleteGame(g.game_id, pw)
      await load()
      success(t('admin.deleted'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedDeleteGame')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const createGame = async () => {
    if (selectedIds.length < 3) { alert(t('errors.pickAtLeast3')); return }
    setLoading(true)
    setError(null)
    try {
      const res = await api.createGameByPeople(newTitle, newPassword, selectedIds)
      try { localStorage.setItem(`adminpw:${res.game_id}`, newPassword) } catch {}
      setNewPassword('')
      setSelectedIds([])
      await load()
      navigate(`/game/${res.game_id}/links`)
      success(t('toasts.gameCreated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedCreateGame')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const removeSelectedParticipant = (id: string) => {
    setSelectedIds(prev => prev.filter(pid => pid !== id))
  }

  const addPerson = async () => {
    const name = newPersonName.trim()
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      await api.addPeople([name], masterPassword || undefined)
      setNewPersonName('')
      setPeople(await api.listPeople())
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setError(msg || t('errors.failedAddPerson'))
    } finally { setLoading(false) }
  }

  const togglePerson = async (p: Person) => {
    setLoading(true)
    setError(null)
    try {
      await api.togglePersonActive(p.id, !p.active, masterPassword || undefined)
      setPeople(await api.listPeople())
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setError(msg || t('errors.failedChangeStatus'))
    } finally { setLoading(false) }
  }

  const renamePerson = async (p: Person) => {
    const name = prompt(t('admin.promptRenamePerson'), p.name)
    if (!name || name.trim() === p.name) return
    setLoading(true)
    setError(null)
    try {
      await api.renamePerson(p.id, name.trim(), masterPassword || undefined)
      setPeople(await api.listPeople())
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setError(msg || t('errors.failedRename'))
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-3">{t('admin.createSectionTitle')}</h1>
        <div className="grid gap-4">
          <FormField label={t('create.form.title')} htmlFor={titleFieldId}>
            <Input id={titleFieldId} value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          </FormField>
          <FormField label={t('create.form.password')} htmlFor={adminPasswordFieldId}>
            <Input id={adminPasswordFieldId} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </FormField>
          <FormField
            label={t('create.form.participants')}
            helperText={t('admin.participantsHelper')}
            actions={
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Button variant="ghost" onClick={()=>setPickerOpen(true)}>{t('create.pickFromDirectory')}</Button>
                <span>{t('common.selectedCount', { count: selectedIds.length })}</span>
              </div>
            }
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-300">{t('admin.selectionLabel')}</p>
              {selectedPeoplePreview.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPeoplePreview.map(person => (
                    <Chip
                      key={person.id}
                      label={person.name}
                      onRemove={() => removeSelectedParticipant(person.id)}
                      removeLabel={t('admin.removeParticipantFromSelection', { name: person.name })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t('admin.noParticipants')}</p>
              )}
            </div>
          </FormField>
          <Button onClick={createGame} disabled={loading || !newPassword || selectedIds.length < 3}>{t('buttons.create')}</Button>
        </div>
      </GlassCard>
      <PeoplePicker
        open={pickerOpen}
        onClose={()=>setPickerOpen(false)}
        onConfirm={(selection)=>{ setSelectedIds(selection.ids); setPickerOpen(false) }}
        initialSelected={selectedIds}
      />

      <GlassCard>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">{t('admin.gamesSectionTitle')}</h1>
          <Button variant="ghost" onClick={load} disabled={loading}>{loading ? t('buttons.refreshing') : t('buttons.refresh')}</Button>
        </div>
        {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
        <div className="mt-3 space-y-3">
          {games.map(g => {
            const meta = t('admin.gameMeta', { count: g.participant_count, date: new Date(g.created_at).toLocaleString() })
            return (
              <div key={g.game_id} className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="sm:col-span-2">
                    <div className="font-medium flex items-center gap-2">
                      {g.title}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${g.active ? 'bg-primary/15 text-primary border-primary/30 border' : 'bg-dark/40 text-light border-light/20 border'}`}>{g.active ? t('status.active') : t('status.inactive')}</span>
                      {g.any_revealed && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-200">{t('status.revealed')}</span>}
                    </div>
                    <div className="text-xs opacity-80">{meta}</div>
                    <div className="mt-2">
                      <Input
                        type="password"
                        placeholder={t('labels.adminPassword')}
                        className="text-sm"
                        value={passwords[g.game_id] || ''}
                        onChange={e=>setPasswords(prev=>({...prev, [g.game_id]: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 w-full justify-items-stretch">
                    <Link className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-center w-full" to={`/game/${g.game_id}/links`}>{t('buttons.open')}</Link>
                    <Button className="w-full" variant="ghost" onClick={() => renameTitle(g)}>{t('buttons.rename')}</Button>
                    <Button className="w-full" variant="ghost" onClick={() => toggleActive(g)}>{g.active ? t('buttons.deactivate') : t('buttons.reactivate')}</Button>
                    <Button className="w-full" variant="accent" onClick={() => deleteGame(g)}>{t('buttons.delete')}</Button>
                  </div>
                </div>
              </div>
            )
          })}
          {games.length === 0 && <p className="text-slate-300">{t('admin.noGames')}</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-semibold mb-3">{t('admin.peopleSectionTitle')}</h2>
        <div className="grid gap-4">
          <FormField
            label={t('labels.masterPassword')}
            htmlFor={masterPasswordFieldId}
            helperText={t('admin.peopleHelper')}
          >
            <Input
              id={masterPasswordFieldId}
              type="password"
              value={masterPassword}
              onChange={e=>setMasterPassword(e.target.value)}
            />
            {masterError && <p className="text-red-300 text-sm mt-1">{masterError}</p>}
          </FormField>
          <FormField label={t('admin.addPersonLabel')} htmlFor={personNameFieldId}>
            <div className="flex items-center gap-2">
              <Input
                id={personNameFieldId}
                value={newPersonName}
                onChange={e=>setNewPersonName(e.target.value)}
                placeholder={t('admin.personPlaceholder')}
              />
              <Button onClick={addPerson} disabled={loading || !newPersonName.trim()}>{t('buttons.add')}</Button>
            </div>
          </FormField>
          <div className="max-h-72 overflow-auto rounded-2xl border border-white/20 p-2 bg-white/5">
            {people.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-primary/15 text-primary border-primary/30 border' : 'bg-dark/40 text-light border-light/20 border'}`}>{p.active ? t('status.active') : t('status.inactive')}</span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => renamePerson(p)}>{t('buttons.rename')}</Button>
                  <Button variant="ghost" onClick={() => togglePerson(p)}>{p.active ? t('buttons.deactivate') : t('buttons.reactivate')}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </Layout>
  )
}
