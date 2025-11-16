import { useState, useId, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import ParticipantRow from '../components/ParticipantRow'
import FormSection from '../components/FormSection'
import CardSurface from '../components/CardSurface'
import RenameDialog from '../components/RenameDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import HeroCard from '../components/HeroCard'
import AnimatedText from '../components/AnimatedText'
import { validators, formatValidationError, normalizeWhitespace } from '../lib/validation'

type Game = { game_id: string; title: string; created_at: string; any_revealed: boolean; active: boolean; participant_count: number }
type Person = { id: string; name: string; active: boolean }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()
  const { t, locale } = useI18n()
  const { alert } = useModal()
  const [passwords, setPasswords] = useState<Record<string,string>>({})
  const [masterPassword, setMasterPassword] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [masterError, setMasterError] = useState<string | null>(null)
  const [renameGameTarget, setRenameGameTarget] = useState<Game | null>(null)
  const [renamePersonTarget, setRenamePersonTarget] = useState<Person | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; confirmText?: string; onConfirm: () => Promise<void> | void; variant?: 'default' | 'primary' | 'danger' | 'success'; confirmVariant?: 'primary' | 'accent' | 'danger' } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const masterPasswordFieldId = useId()
  const personNameFieldId = useId()

  const {
    data: games = [],
    isLoading: gamesLoading,
    isFetching: isGamesFetching,
    error: gamesError,
    refetch: refetchGames,
  } = useQuery<Game[], Error>({
    queryKey: ['games'],
    queryFn: () => api.listGames(),
  })

  const {
    data: people = [],
    isLoading: peopleLoading,
    error: peopleError,
  } = useQuery<Person[], Error>({
    queryKey: ['people'],
    queryFn: () => api.listPeople(),
  })

  const loading = gamesLoading || peopleLoading
  const activeGames = useMemo(() => games.filter(game => game.active).length, [games])
  const totalParticipants = useMemo(() => games.reduce((sum, game) => sum + game.participant_count, 0), [games])
  const activePeople = useMemo(() => people.filter(person => person.active).length, [people])
  const combinedError = actionError || gamesError?.message || peopleError?.message || null

  const ensureValidTitle = (value: string): string | null => {
    const validationError = validators.title(value)
    if (validationError) {
      toastError(formatValidationError(validationError, t))
      return null
    }
    return normalizeWhitespace(value)
  }

  const ensureValidPersonName = (value: string): string | null => {
    const validationError = validators.personName(value)
    if (validationError) {
      toastError(formatValidationError(validationError, t))
      return null
    }
    return normalizeWhitespace(value)
  }

  const updateGameState = useCallback((gameId: string, updater: (game: Game) => Game) => {
    queryClient.setQueryData<Game[]>(['games'], prev => {
      if (!prev) return prev
      return prev.map(game => (game.game_id === gameId ? updater(game) : game))
    })
  }, [queryClient])

  const toggleActive = async (g: Game) => {
    if (actionLoading) return
    const pw = passwords[g.game_id] || ''
    if (!pw) {
      await alert({ title: t('admin.title'), message: t('admin.enterPasswordPrompt') })
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await api.toggleGameActive(g.game_id, pw, !g.active)
      updateGameState(g.game_id, game => ({ ...game, active: !game.active }))
      success(g.active ? t('admin.deactivated') : t('admin.activated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedToggleGame')
      setActionError(msg)
      toastError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const renameTitle = async (g: Game, newTitle: string) => {
    if (actionLoading) return
    const pw = passwords[g.game_id] || ''
    if (!pw) {
      await alert({ title: t('admin.title'), message: t('admin.enterPasswordPrompt') })
      return
    }
    const normalizedTitle = ensureValidTitle(newTitle)
    if (!normalizedTitle) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.updateGameTitle(g.game_id, pw, normalizedTitle)
      updateGameState(g.game_id, game => ({ ...game, title: normalizedTitle }))
      success(t('admin.titleUpdated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedUpdateTitle')
      setActionError(msg)
      toastError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const deleteGame = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) {
      await alert({ title: t('admin.title'), message: t('admin.enterPasswordPrompt') })
      return
    }
    setConfirmConfig({
      title: t('admin.deleteConfirmTitle'),
      message: t('admin.deleteConfirmMessage', { title: g.title }),
      confirmText: t('admin.deleteConfirmCta'),
      variant: 'danger',
      confirmVariant: 'danger',
      onConfirm: async () => {
        if (actionLoading) return
        setActionLoading(true)
        setActionError(null)
        try {
          await api.deleteGame(g.game_id, pw)
          await queryClient.invalidateQueries({ queryKey: ['games'] })
          success(t('admin.deleted'))
        } catch (err: any) {
          const msg = err?.message || t('errors.failedDeleteGame')
          setActionError(msg)
          toastError(msg)
        } finally {
          setActionLoading(false)
          setConfirmConfig(null)
        }
      },
    })
  }

  const addPerson = async () => {
    if (actionLoading) return
    const normalized = ensureValidPersonName(newPersonName)
    if (!normalized) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.addPeople([normalized], masterPassword || undefined)
      setNewPersonName('')
      await queryClient.invalidateQueries({ queryKey: ['people'] })
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setActionError(msg || t('errors.failedAddPerson'))
      toastError(msg || t('errors.failedAddPerson'))
    } finally {
      setActionLoading(false)
    }
  }

  const togglePerson = async (p: Person) => {
    if (actionLoading) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.togglePersonActive(p.id, !p.active, masterPassword || undefined)
      await queryClient.invalidateQueries({ queryKey: ['people'] })
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setActionError(msg || t('errors.failedChangeStatus'))
      toastError(msg || t('errors.failedChangeStatus'))
    } finally {
      setActionLoading(false)
    }
  }

  const renamePerson = async (p: Person, newName: string) => {
    if (actionLoading) return
    const normalized = ensureValidPersonName(newName)
    if (!normalized) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.renamePerson(p.id, normalized, masterPassword || undefined)
      await queryClient.invalidateQueries({ queryKey: ['people'] })
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError(t('errors.masterPasswordRequired'))
      setActionError(msg || t('errors.failedRename'))
      toastError(msg || t('errors.failedRename'))
    } finally {
      setActionLoading(false)
    }
  }

  const scrollToDirectory = () => {
    const target = document.getElementById('people-directory-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Layout>
      <HeroCard
        eyebrow={<AnimatedText>{t('admin.title')}</AnimatedText>}
        title={<AnimatedText>{t('admin.dashboardHeroTitle')}</AnimatedText>}
        description={<AnimatedText watch={`${games.length}-${activePeople}`}>{t('admin.dashboardHeroDescription', { games: games.length, people: activePeople })}</AnimatedText>}
        actions={(
          <>
            <Button onClick={() => navigate('/')}>{t('buttons.create')}</Button>
            <Button type="button" variant="ghost" onClick={scrollToDirectory}>{t('admin.goToDirectory')}</Button>
          </>
        )}
      />
      <GlassCard className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg space-y-1">
            <p className="text-sm uppercase tracking-wide text-white/60">{t('admin.stats.totalGames')}</p>
            <p className="text-3xl font-semibold text-white">{games.length}</p>
          </div>
          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4 shadow-lg space-y-1">
            <p className="text-sm uppercase tracking-wide text-primary/80">{t('admin.stats.activeGames')}</p>
            <p className="text-3xl font-semibold text-white">{activeGames}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg space-y-1">
            <p className="text-sm uppercase tracking-wide text-white/60">{t('admin.stats.activePeople')}</p>
            <p className="text-3xl font-semibold text-white">{activePeople}</p>
            <p className="text-xs text-white/60">{t('admin.stats.totalParticipants', { count: totalParticipants })}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          title={t('admin.gamesSectionTitle')}
          action={
            <Button variant="ghost" onClick={() => refetchGames()} disabled={isGamesFetching}>
              {isGamesFetching ? t('buttons.refreshing') : t('buttons.refresh')}
            </Button>
          }
        />
        {combinedError && <p className="text-red-300 text-sm mt-2">{combinedError}</p>}
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
                  { label: t('buttons.rename'), onClick: () => setRenameGameTarget(g) },
                  { label: g.active ? t('buttons.deactivate') : t('buttons.reactivate'), onClick: () => toggleActive(g) },
                  { label: t('buttons.delete'), variant: 'accent', onClick: () => deleteGame(g) },
                ]}
              />
            )
          })}
          {games.length === 0 && <p className="text-slate-300">{t('admin.noGames')}</p>}
        </div>
      </GlassCard>

      <GlassCard id="people-directory-section">
        <SectionHeader title={t('admin.peopleSectionTitle')} description={t('admin.peopleHelper')} />
        <div className="grid gap-6 mt-4">
          <FormSection title={t('labels.masterPassword')}>
            <FormField label={t('labels.masterPassword')} htmlFor={masterPasswordFieldId} helperText={t('admin.peopleHelper')}>
              <Input
                id={masterPasswordFieldId}
                type="password"
                value={masterPassword}
                onChange={e=>setMasterPassword(e.target.value)}
              />
            </FormField>
            {masterError && <p className="text-red-300 text-sm">{masterError}</p>}
          </FormSection>
          <FormSection
            title={t('admin.addPersonLabel')}
            action={<Button onClick={addPerson} disabled={actionLoading || !newPersonName.trim()}>{t('buttons.add')}</Button>}
          >
            <FormField label={t('admin.personPlaceholder')} htmlFor={personNameFieldId}>
              <Input
                id={personNameFieldId}
                value={newPersonName}
                onChange={e=>setNewPersonName(e.target.value)}
                placeholder={t('admin.personPlaceholder')}
              />
            </FormField>
          </FormSection>
          <CardSurface className="max-h-72 overflow-auto p-2 space-y-2">
            {people.map(p => (
              <ParticipantRow
                key={p.id}
                name={p.name}
                status={p.active ? 'active' : 'inactive'}
                actions={[
                  { label: t('buttons.rename'), onClick: () => setRenamePersonTarget(p) },
                  { label: p.active ? t('buttons.deactivate') : t('buttons.reactivate'), onClick: () => togglePerson(p) },
                ]}
              />
            ))}
          </CardSurface>
        </div>
      </GlassCard>

      <RenameDialog
        open={!!renameGameTarget}
        title={t('admin.promptNewTitle')}
        initialValue={renameGameTarget?.title || ''}
        onSubmit={async value => {
          if (!renameGameTarget) return
          await renameTitle(renameGameTarget, value)
          setRenameGameTarget(null)
        }}
        onClose={() => setRenameGameTarget(null)}
      />
      <RenameDialog
        open={!!renamePersonTarget}
        title={t('admin.promptRenamePerson')}
        initialValue={renamePersonTarget?.name || ''}
        onSubmit={async value => {
          if (!renamePersonTarget) return
          await renamePerson(renamePersonTarget, value)
          setRenamePersonTarget(null)
        }}
        onClose={() => setRenamePersonTarget(null)}
      />
      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        confirmText={confirmConfig?.confirmText}
        variant={confirmConfig?.variant}
        confirmVariant={confirmConfig?.confirmVariant}
        onConfirm={async () => {
          if (confirmConfig?.onConfirm) await confirmConfig.onConfirm()
        }}
        onClose={() => setConfirmConfig(null)}
      />
    </Layout>
  )
}
