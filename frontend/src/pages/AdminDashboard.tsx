import { useEffect, useState, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { api } from '../lib/api'
import { useModal } from '../components/ModalProvider'
import { useToast } from '../components/ToastProvider'
import Input from '../components/Input'
import FormField from '../components/FormField'
import { useI18n } from '../i18n/I18nProvider'
import SectionHeader from '../components/SectionHeader'
import GameCard from '../components/GameCard'
import StatusBadge from '../components/StatusBadge'

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
  const [people, setPeople] = useState<Person[]>([])
  const [masterPassword, setMasterPassword] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [masterError, setMasterError] = useState<string | null>(null)
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

  const goToCreate = () => {
    navigate('/create')
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
        <SectionHeader
          title={t('admin.createSectionTitle')}
          description={t('admin.createSectionHelper')}
          action={<Button onClick={goToCreate}>{t('buttons.create')}</Button>}
        />
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title={t('admin.gamesSectionTitle')}
          action={
            <Button variant="ghost" onClick={load} disabled={loading}>
              {loading ? t('buttons.refreshing') : t('buttons.refresh')}
            </Button>
          }
        />
        {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
        <div className="mt-3 space-y-3">
          {games.map(g => {
            const meta = t('admin.gameMeta', { count: g.participant_count, date: new Date(g.created_at).toLocaleString() })
            const statuses = [
              { label: g.active ? t('status.active') : t('status.inactive'), variant: g.active ? 'active' : 'inactive' as const },
            ]
            if (g.any_revealed) {
              statuses.push({ label: t('status.revealed'), variant: 'revealed' })
            }
            return (
              <GameCard
                key={g.game_id}
                title={g.title}
                subtitle={meta}
                statuses={statuses}
                adminPassword={passwords[g.game_id] || ''}
                passwordPlaceholder={t('labels.adminPassword')}
                onAdminPasswordChange={value => setPasswords(prev => ({ ...prev, [g.game_id]: value }))}
                actions={[
                  { label: t('buttons.open'), variant: 'primary', onClick: () => navigate(`/game/${g.game_id}/links`) },
                  { label: t('buttons.rename'), onClick: () => renameTitle(g) },
                  {
                    label: g.active ? t('buttons.deactivate') : t('buttons.reactivate'),
                    onClick: () => toggleActive(g),
                  },
                  { label: t('buttons.delete'), variant: 'accent', onClick: () => deleteGame(g) },
                ]}
              />
            )
          })}
          {games.length === 0 && <p className="text-slate-300">{t('admin.noGames')}</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title={t('admin.peopleSectionTitle')}
          description={t('admin.peopleHelper')}
        />
        <div className="grid gap-4 mt-4">
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
                  <StatusBadge label={p.active ? t('status.active') : t('status.inactive')} variant={p.active ? 'active' : 'inactive'} />
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
