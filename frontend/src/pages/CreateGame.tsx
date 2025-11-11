import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import PeoplePicker from '../components/PeoplePicker'

export default function CreateGame() {
  const [title, setTitle] = useState('Secret Friend')
  const [password, setPassword] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (selectedIds.length < 3) {
      setError('Pick at least 3 participants from the directory.')
      return
    }
    setLoading(true)
    try {
      const res = await api.createGameByPeople(title, password, selectedIds)
      try { localStorage.setItem(`adminpw:${res.game_id}`, password) } catch {}
      navigate(`/game/${res.game_id}/links`)
    } catch (err: any) {
      setError(err.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-4">Create a Game</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm mb-1">Admin Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Participants</label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={()=>setPickerOpen(true)}>Pick from directory</Button>
              <span className="text-sm text-slate-300">Selected: {selectedIds.length}</span>
            </div>
          </div>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <Button type="submit" disabled={loading || selectedIds.length < 3}>{loading ? 'Creating.' : 'Create Game'}</Button>
        </form>
      </GlassCard>
      <PeoplePicker open={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={(ids)=>{ setSelectedIds(ids); setPickerOpen(false) }} />
    </Layout>
  )
}

