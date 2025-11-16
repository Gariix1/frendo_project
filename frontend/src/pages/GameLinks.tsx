import { useEffect, useState } from 'react'
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
import StatusPills from '../components/StatusPills'
import CopyButton from '../components/CopyButton'
import WhatsAppButton from '../components/WhatsAppButton'

type Person = { id: string; name: string; active: boolean }
type LinkItem = { name: string; link: string }
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

  useEffect(() => { (async () => { try { setPeople(await api.listPeople()) } catch {} })() }, [])

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
    const newName = newNameOverride ?? prompt(t('buttons.rename') + ':', p.name)
    if (!newName || newName.trim() === p.name) return
    setError(null)
    setLoading(true)
    try {
      await api.renameParticipant(gameId, adminPassword, p.id, newName.trim())
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
        <h1 className="text-2xl font-semibold mb-4">{t('sections.shareLinks')}</h1>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">{t('labels.adminPassword')}</label>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-light/30 text-slate-100 placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={fetchLinks} disabled={!adminPassword || loading}>{loading ? t('buttons.loading') : t('buttons.loadLinks')}</Button>
            <Button variant="ghost" onClick={() => doDraw(false)} disabled={!adminPassword || loading || anyRevealed}>{assignmentVersion && assignmentVersion > 0 ? t('draw.redraw') : t('draw.draw')}</Button>
            {anyRevealed && (
              <Button variant="accent" onClick={async () => {
                const ok = await confirm({
                  title: t('confirm.forceRedraw.title'),
                  message: t('confirm.forceRedraw.message'),
                  confirmText: t('confirm.forceRedraw.cta'),
                })
                if (ok) doDraw(true)
              }} disabled={!adminPassword || loading}>{t('draw.forceRedraw')}</Button>
            )}
          </div>
          {assignmentVersion === 0 && (
            <p className="text-amber-300 text-sm">{t('warnings.noDrawYet')}</p>
          )}
          {anyRevealed && (
            <p className="text-amber-300 text-sm">{t('warnings.someRevealed')}</p>
          )}
          {error && <p className="text-red-300 text-sm">{error}</p>}
        </div>
      </GlassCard>

      {links && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-3">{t('sections.participants')}</h2>
          <ul className="space-y-3">
            {links.map((i) => {
              const p = participants?.find(pp => pp.name === i.name)
              return (
                <li key={i.link} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span className="truncate max-w-[16rem]">{i.name}</span>
                      {p && (<StatusPills active={p.active} viewed={p.viewed} />)}
                    </div>
                    <div className="mt-1">
                      <Tag text={i.link} onClick={() => copyText(i.link)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton text={i.link} />
                    <WhatsAppButton name={i.name} link={i.link} />
                    <Button variant="ghost" onClick={() => { setQrLink(i.link); setQrTitle(t('gameLinks.qrTitle', { name: i.name })); setQrOpen(true) }}>{t('buttons.qr')}</Button>
                    {p && (
                      <>
                        <Button variant="ghost" onClick={() => { setManageTarget(p); setManageOpen(true) }}>{t('buttons.manage')}</Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
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
          <h2 className="text-xl font-semibold mb-3">{t('sections.addParticipants')}</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1">{t('labels.fromDirectory')}</label>
              <div className="max-h-40 overflow-auto rounded-2xl border border-white/20 p-2 bg-white/5">
                {people.map(p => (
                  <label key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-xl ${p.active ? '' : 'opacity-60'}`}>
                    <input type="checkbox" disabled={!p.active} checked={!!selectedPeople[p.id]} onChange={e=> setSelectedPeople(prev=> ({...prev, [p.id]: e.target.checked}))} />
                    <span>{p.name}</span>
                  </label>
                ))}
                {people.length === 0 && <div className="text-sm text-slate-300">{t('helper.noPeopleAdmin')}</div>}
              </div>
            </div>
            <div>
              <Button onClick={addPeople} disabled={!adminPassword || loading || (!Object.values(selectedPeople).some(Boolean))}>{t('buttons.addSelected')}</Button>
            </div>
          </div>
        </GlassCard>
      )}
      
    </Layout>
  )
}
