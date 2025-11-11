import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import { copyText } from '../lib/clipboard'
import { useModal } from '../components/ModalProvider'
type Person = { id: string; name: string; active: boolean }

type LinkItem = { name: string; link: string }
type Participant = { id: string; name: string; token: string; active: boolean; viewed: boolean }

export default function GameLinks() {
  const { gameId } = useParams()
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
      // Load status first to know if draw is needed
      const status = await api.getStatus(gameId, adminPassword)
      setAssignmentVersion(status.assignment_version)
      setAnyRevealed(status.any_revealed)
      setParticipants(status.participants)
      const data = await api.getLinks(gameId, adminPassword)
      setLinks(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load links')
      setLinks(null)
      setParticipants(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    (async () => {
      try { setPeople(await api.listPeople()) } catch {}
    })()
  }, [])

  const doDraw = async (force = false) => {
    if (!gameId) return
    setError(null)
    setLoading(true)
    try {
      await api.draw(gameId, adminPassword, force)
      await fetchLinks()
    } catch (err: any) {
      setError(err.message || 'Failed to perform draw')
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
    } catch (err: any) {
      setError(err.message || 'Failed to add participants')
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
    } catch (err: any) {
      setError(err.message || 'Failed to remove participant')
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
    } catch (err: any) {
      setError(err.message || 'Failed to change status')
    } finally {
      setLoading(false)
    }
  }

  const rename = async (p: Participant) => {
    if (!gameId) return
    const newName = prompt('New name:', p.name)
    if (!newName || newName.trim() === p.name) return
    setError(null)
    setLoading(true)
    try {
      await api.renameParticipant(gameId, adminPassword, p.id, newName.trim())
      await fetchLinks()
    } catch (err: any) {
      setError(err.message || 'Failed to rename participant')
    } finally {
      setLoading(false)
    }
  }

  const whatsappText = (name: string, link: string) =>
    encodeURIComponent(`Hola ${name}! Te comparto tu enlace único para el Amigo Secreto: ${link}`)

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-4">Share Links</h1>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Admin Password</label>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={fetchLinks} disabled={!adminPassword || loading}>{loading ? 'Loading…' : 'Load Links'}</Button>
            <Button variant="ghost" onClick={() => doDraw(false)} disabled={!adminPassword || loading || anyRevealed}>Draw</Button>
            {anyRevealed && (
              <Button variant="ghost" onClick={async () => {
                const ok = await confirm({
                  title: 'Force Redraw',
                  message: 'Some links have already been revealed. Forcing a redraw will reset all reveals and assignments. Are you sure?',
                  confirmText: 'Force Redraw',
                })
                if (ok) doDraw(true)
              }} disabled={!adminPassword || loading}>Force Redraw</Button>
            )}
          </div>
          {assignmentVersion === 0 && (
            <p className="text-amber-300 text-sm">No draw yet. Click "Draw" to assign secret friends.</p>
          )}
          {anyRevealed && (
            <p className="text-amber-300 text-sm">Some links have already been revealed. Redraw is blocked here to avoid conflicts.</p>
          )}
          {error && <p className="text-red-300 text-sm">{error}</p>}
        </div>
      </GlassCard>

      {links && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-3">Participants</h2>
          <ul className="space-y-3">
            {links.map((i) => {
              const p = participants?.find(pp => pp.name === i.name)
              return (
                <li key={i.link} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {i.name}
                      {p && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-600/30 text-emerald-200' : 'bg-slate-600/30 text-slate-200'}`}>
                          {p.active ? 'active' : 'inactive'}{p.viewed ? ' · viewed' : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 break-all">{i.link}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={() => copyText(i.link)}>
                    Copy
                  </Button>
                    <a className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${whatsappText(i.name, i.link)}`}>WhatsApp</a>
                    {p && (
                      <>
                        <Button variant="ghost" onClick={() => toggleActive(p)}>{p.active ? 'Deactivate' : 'Reactivate'}</Button>
                        {!anyRevealed && <Button variant="ghost" onClick={() => remove(p.id)}>Remove</Button>}
                        <Button variant="ghost" onClick={() => rename(p)}>Rename</Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </GlassCard>
      )}

      {!anyRevealed && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-3">Add Participants</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1">From directory</label>
              <div className="max-h-40 overflow-auto rounded-2xl border border-white/20 p-2 bg-white/5">
                {people.map(p => (
                  <label key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-xl ${p.active ? '' : 'opacity-60'}`}>
                    <input type="checkbox" disabled={!p.active} checked={!!selectedPeople[p.id]} onChange={e=> setSelectedPeople(prev=> ({...prev, [p.id]: e.target.checked}))} />
                    <span>{p.name}</span>
                  </label>
                ))}
                {people.length === 0 && <div className="text-sm text-slate-300">No people yet. Add them in the Admin page.</div>}
              </div>
            </div>
            <div>
              <Button onClick={addPeople} disabled={!adminPassword || loading || (!Object.values(selectedPeople).some(Boolean))}>Add Selected</Button>
            </div>
          </div>
        </GlassCard>
      )}
      
    </Layout>
  )
}
