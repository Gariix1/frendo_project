import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import { copyText } from '../lib/clipboard'
import { useModal } from '../components/ModalProvider'
import { useToast } from '../components/ToastProvider'
import QrModal from '../components/QrModal'
import { useI18n } from '../i18n/I18nProvider'
import Tag from '../components/Tag'
import ManageParticipantModal from '../components/ManageParticipantModal'
import CopyButton from '../components/CopyButton'
import WhatsAppButton from '../components/WhatsAppButton'
import ParticipantSelectRow from '../components/ParticipantSelectRow'
import ParticipantRow from '../components/ParticipantRow'
import FormSection from '../components/FormSection'
import ConfirmDialog from '../components/ConfirmDialog'
import CardSurface from '../components/CardSurface'
import { validators, formatValidationError, normalizeWhitespace } from '../lib/validation'

type Person = { id: string; name: string; active: boolean }
type LinkItem = { participant_id: string; token: string; name: string; link: string }
type Participant = { id: string; name: string; token: string; active: boolean; viewed: boolean }

export default function GameLinks() {
  const { gameId } = useParams()
  const { t } = useI18n()
  const [adminPassword, setAdminPassword] = useState('')
  const [links, setLinks] = useState<LinkItem[] | null>(null)
  const [participants, setParticipants] = useState<Participant[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [assignmentVersion, setAssignmentVersion] = useState<number | null>(null)
  const [anyRevealed, setAnyRevealed] = useState<boolean>(false)
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<Record<string, boolean>>({})
  const { confirm } = useModal()
  const { success, error: toastError } = useToast()
  const [qrOpen, setQrOpen] = useState(false)
  const [qrLink, setQrLink] = useState<string | null>(null)
  const [qrTitle, setQrTitle] = useState<string>('QR')
  const [manageOpen, setManageOpen] = useState(false)
  const [manageTarget, setManageTarget] = useState<Participant | null>(null)
  const [confirmForce, setConfirmForce] = useState(false)

  const participantById = useMemo(() => {
    const map = new Map<string, Participant>()
    ;(participants || []).forEach(p => map.set(p.id, p))
    return map
  }, [participants])

  useEffect(() => {
    if (!gameId) return
    try {
      const pw = localStorage.getItem(`adminpw:${gameId}`) || ''
      setAdminPassword(pw)
    } catch {}
  }, [gameId])

  const fetchLinks = async () => {
    if (!gameId) return
    setError(null)
    setLoading(true)
    try {
      const status = await api.getStatus(gameId, adminPassword)
      setAssignmentVersion(status.assignment_version)
      setAnyRevealed(status.any_revealed)
      setParticipants(status.participants)
      const data = await api.getLinks(gameId, adminPassword)
      setLinks(data)
    } catch (err: any) {
      setError(err.message || t('gameLinks.errorLoad'))
      setLinks(null)
      setParticipants(null)
    } finally {
      setLoading(false)
    }
  }

  const loadPeople = useCallback(async () => {
    try {
      setPeople(await api.listPeople())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => { loadPeople() }, [loadPeople])

  const doDraw = async (force = false) => {
    if (!gameId) return
    setError(null)
    setLoading(true)
    try {
      await api.draw(gameId, adminPassword, force)
      await fetchLinks()
      success(force ? t('toasts.assignmentsRedrawn') : t('toasts.assignmentsCreated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedDraw')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const addPeople = async () => {
    if (!gameId) return
    const ids = people.filter(p => selectedPeople[p.id]).map(p => p.id)
    if (!ids.length) return
    setError(null)
    setLoading(true)
    try {
      await api.addParticipantsByIds(gameId, adminPassword, ids)
      setSelectedPeople({})
      await fetchLinks()
      success(t('toasts.participantsAdded'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedAddParticipants')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const remove = async (pid: string) => {
    if (!gameId) return
    setError(null)
    setLoading(true)
    try {
      await api.removeParticipant(gameId, adminPassword, pid)
      await fetchLinks()
      success(t('toasts.participantRemoved'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedRemoveParticipant')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (p: Participant) => {
    if (!gameId) return
    setError(null)
    setLoading(true)
    try {
      if (p.active) await api.deactivate(gameId, adminPassword, p.token)
      else await api.reactivate(gameId, adminPassword, p.token)
      await fetchLinks()
      success(p.active ? t('toasts.deactivated') : t('toasts.reactivated'))
    } catch (err: any) {
      const msg = err?.message || t('errors.failedChangeStatus')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const rename = async (p: Participant, newNameOverride?: string) => {
    if (!gameId) return
    const rawName = newNameOverride ?? prompt(t('buttons.rename') + ':', p.name)
    if (!rawName) return
    const validationError = validators.participantName(rawName)
    if (validationError) {
      toastError(formatValidationError(validationError, t))
      return
    }
    const normalizedName = normalizeWhitespace(rawName)
    if (normalizedName === p.name) return
    setError(null)
    setLoading(true)
    try {
      await api.renameParticipant(gameId, adminPassword, p.id, normalizedName)
      await fetchLinks()
    } catch (err: any) {
      setError(err.message || t('errors.failedRename'))
    } finally {
      setLoading(false)
    }
  }

  // WhatsApp text generation centralized in WhatsAppButton

  return (
    <Layout>
      <GlassCard>
        <FormSection
          title={t('sections.shareLinks')}
          description={t('labels.adminPassword')}
          action={<Button onClick={fetchLinks} disabled={!adminPassword || loading}>{loading ? t('buttons.loading') : t('buttons.loadLinks')}</Button>}
        >
          <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-light/30 text-slate-100 placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => doDraw(false)} disabled={!adminPassword || loading || anyRevealed}>{assignmentVersion && assignmentVersion > 0 ? t('draw.redraw') : t('draw.draw')}</Button>
            {anyRevealed && (
              <Button variant="accent" onClick={() => setConfirmForce(true)} disabled={!adminPassword || loading}>{t('draw.forceRedraw')}</Button>
            )}
          </div>
          {assignmentVersion === 0 && (
            <p className="text-amber-300 text-sm">{t('warnings.noDrawYet')}</p>
          )}
          {anyRevealed && (
            <p className="text-amber-300 text-sm">{t('warnings.someRevealed')}</p>
          )}
          {error && <p className="text-red-300 text-sm">{error}</p>}
        </FormSection>
      </GlassCard>

      {links && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-3">{t('sections.participants')}</h2>
          <div className="space-y-3">
            {links.map(link => {
              const participant = participantById.get(link.participant_id) || null
              return (
                <ParticipantRow
                  key={link.participant_id}
                  name={link.name}
                  status={participant?.active ? 'active' : 'inactive'}
                  secondaryStatus={participant?.viewed ? 'viewed' : undefined}
                  description={<Tag text={link.link} onClick={() => copyText(link.link)} />}
                  rightContent={
                    <>
                      <CopyButton text={link.link} />
                      <WhatsAppButton name={link.name} link={link.link} />
                      <Button variant="ghost" onClick={() => { setQrLink(link.link); setQrTitle(t('gameLinks.qrTitle', { name: link.name })); setQrOpen(true) }}>{t('buttons.qr')}</Button>
                      {participant && (
                        <Button variant="ghost" onClick={() => { setManageTarget(participant); setManageOpen(true) }}>{t('buttons.manage')}</Button>
                      )}
                    </>
                  }
                />
              )
            })}
          </div>
        </GlassCard>
      )}
      <QrModal open={qrOpen} onClose={()=>setQrOpen(false)} link={qrLink} title={qrTitle} />
      <ManageParticipantModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        participant={manageTarget}
        canRemove={!anyRevealed}
        onRename={async (newName) => { if (!manageTarget) return; await rename(manageTarget, newName); setManageOpen(false); await fetchLinks() }}
        onToggle={async () => { if (!manageTarget) return; await toggleActive(manageTarget); setManageOpen(false); await fetchLinks() }}
        onRemove={async () => { if (!manageTarget) return; await remove(manageTarget.id); setManageOpen(false); await fetchLinks() }}
      />
      {!anyRevealed && (
        <GlassCard>
          <FormSection
            title={t('sections.addParticipants')}
            description={t('labels.fromDirectory')}
            action={(
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={loadPeople} disabled={loading}>{t('buttons.refresh')}</Button>
                <Button onClick={addPeople} disabled={!adminPassword || loading || (!Object.values(selectedPeople).some(Boolean))}>{t('buttons.addSelected')}</Button>
              </div>
            )}
          >
            <CardSurface className="max-h-40 overflow-auto p-2">
              {people.map(p => (
                <ParticipantSelectRow
                  key={p.id}
                  name={p.name}
                  active={p.active}
                  checked={!!selectedPeople[p.id]}
                  onToggle={checked => setSelectedPeople(prev => ({ ...prev, [p.id]: checked }))}
                />
              ))}
              {people.length === 0 && <div className="text-sm text-slate-300">{t('helper.noPeopleAdmin')}</div>}
            </CardSurface>
          </FormSection>
        </GlassCard>
      )}
      <ConfirmDialog
        open={confirmForce}
        title={t('confirm.forceRedraw.title')}
        message={t('confirm.forceRedraw.message')}
        confirmText={t('confirm.forceRedraw.cta')}
        variant="danger"
        confirmVariant="danger"
        onConfirm={() => doDraw(true)}
        onClose={() => setConfirmForce(false)}
      />
      
    </Layout>
  )
}
