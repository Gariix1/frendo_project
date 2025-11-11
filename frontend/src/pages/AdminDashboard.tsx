import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { api } from '../lib/api'
import { useModal } from '../components/ModalProvider'
import PeoplePicker from '../components/PeoplePicker'

type Game = { game_id: string; title: string; created_at: string; any_revealed: boolean; active: boolean; participant_count: number }
type Person = { id: string; name: string; active: boolean }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { confirm } = useModal()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwords, setPasswords] = useState<Record<string,string>>({})
  const [newTitle, setNewTitle] = useState('Secret Friend')
  const [newPassword, setNewPassword] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [masterPassword, setMasterPassword] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [masterError, setMasterError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await api.listGames()
      setGames(list)
    } catch (err: any) {
      setError(err.message || 'Failed to list games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { (async () => { try { setPeople(await api.listPeople()) } catch {} })() }, [])

  const toggleActive = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert('Enter admin password for this game'); return }
    setLoading(true)
    setError(null)
    try {
      await api.toggleGameActive(g.game_id, pw, !g.active)
      await load()
    } catch (err: any) {
      setError(err.message || 'Failed to toggle game')
    } finally {
      setLoading(false)
    }
  }

  const renameTitle = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert('Enter admin password for this game'); return }
    const title = prompt('New title:', g.title)
    if (!title || title.trim() === g.title) return
    setLoading(true)
    setError(null)
    try {
      await api.updateGameTitle(g.game_id, pw, title.trim())
      await load()
    } catch (err: any) {
      setError(err.message || 'Failed to update title')
    } finally {
      setLoading(false)
    }
  }

  const deleteGame = async (g: Game) => {
    const pw = passwords[g.game_id] || ''
    if (!pw) { alert('Enter admin password for this game'); return }
    const ok = await confirm({
      title: 'Delete game',
      message: `Delete game "${g.title}" permanently? This cannot be undone.`,
      confirmText: 'Delete'
    })
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      await api.deleteGame(g.game_id, pw)
      await load()
    } catch (err: any) {
      setError(err.message || 'Failed to delete game')
    } finally {
      setLoading(false)
    }
  }

  const createGame = async () => {
    if (selectedIds.length < 3) { alert('Pick at least 3 participants from directory'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await api.createGameByPeople(newTitle, newPassword, selectedIds)
      try { localStorage.setItem(`adminpw:${res.game_id}`, newPassword) } catch {}
      setNewPassword('')
      setSelectedIds([])
      await load()
      navigate(`/game/${res.game_id}/links`)
    } catch (err: any) {
      setError(err.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
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
      if (msg.toLowerCase().includes('master password')) setMasterError('Master password required or invalid')
      setError(msg || 'Failed to add person')
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
      if (msg.toLowerCase().includes('master password')) setMasterError('Master password required or invalid')
      setError(msg || 'Failed to change person status')
    } finally { setLoading(false) }
  }

  const renamePerson = async (p: Person) => {
    const name = prompt('New name:', p.name)
    if (!name || name.trim() === p.name) return
    setLoading(true)
    setError(null)
    try {
      await api.renamePerson(p.id, name.trim(), masterPassword || undefined)
      setPeople(await api.listPeople())
      setMasterError(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('master password')) setMasterError('Master password required or invalid')
      setError(msg || 'Failed to rename')
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-3">Create Game</h1>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Admin Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Participants</label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={()=>setPickerOpen(true)}>Pick from directory</Button>
              <span className="text-sm text-slate-300">Selected: {selectedIds.length}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Pick at least 3 active people from the directory.</p>
          </div>
          <div>
            <Button onClick={createGame} disabled={loading || !newPassword || selectedIds.length < 3}>Create</Button>
          </div>
        </div>
      </GlassCard>
      <PeoplePicker open={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={(ids)=>{ setSelectedIds(ids); setPickerOpen(false) }} />

      <GlassCard>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Games</h1>
          <Button variant="ghost" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
        {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
        <div className="mt-3 space-y-3">
          {games.map(g => (
            <div key={g.game_id} className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-2">
                  <div className="font-medium flex items-center gap-2">
                    {g.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${g.active ? 'bg-emerald-600/30 text-emerald-200' : 'bg-slate-600/30 text-slate-200'}`}>{g.active ? 'active' : 'inactive'}</span>
                    {g.any_revealed && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-200">revealed</span>}
                  </div>
                  <div className="text-xs opacity-80">{g.participant_count} participants · {new Date(g.created_at).toLocaleString()}</div>
                  <div className="mt-2">
                    <input type="password" placeholder="Admin password" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none text-sm"
                      value={passwords[g.game_id] || ''}
                      onChange={e=>setPasswords(prev=>({...prev, [g.game_id]: e.target.value}))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 w-full justify-items-stretch">
                  <Link className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-center w-full" to={`/game/${g.game_id}/links`}>Open</Link>
                  <Button className="w-full" variant="ghost" onClick={() => renameTitle(g)}>Rename</Button>
                  <Button className="w-full" variant="ghost" onClick={() => toggleActive(g)}>{g.active ? 'Deactivate' : 'Reactivate'}</Button>
                  <Button className="w-full" variant="ghost" onClick={() => deleteGame(g)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {games.length === 0 && <p className="text-slate-300">No games yet.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-semibold mb-3">People Directory</h2>
        <p className="text-sm text-slate-300 mb-2">Only admins can manage this list. If you set MASTER_ADMIN_PASSWORD in the backend, enter it here.</p>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Master Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" value={masterPassword} onChange={e=>setMasterPassword(e.target.value)} />
            {masterError && <p className="text-red-300 text-sm mt-1">{masterError}</p>}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">Add person</label>
              <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" value={newPersonName} onChange={e=>setNewPersonName(e.target.value)} placeholder="Name" />
            </div>
            <Button onClick={addPerson} disabled={loading || !newPersonName.trim()}>Add</Button>
          </div>
          <div className="max-h-72 overflow-auto rounded-2xl border border-white/20 p-2 bg-white/5">
            {people.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-600/30 text-emerald-200' : 'bg-slate-600/30 text-slate-200'}`}>{p.active ? 'active' : 'inactive'}</span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => renamePerson(p)}>Rename</Button>
                  <Button variant="ghost" onClick={() => togglePerson(p)}>{p.active ? 'Deactivate' : 'Reactivate'}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </Layout>
  )
}


