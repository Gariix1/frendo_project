import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import { useModal } from '../components/ModalProvider'

export default function ViewResult() {
  const { gameId, token } = useParams()
  const [name, setName] = useState('')
  const [viewed, setViewed] = useState(false)
  const [canReveal, setCanReveal] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { confirm } = useModal()

  useEffect(() => {
    const load = async () => {
      if (!gameId || !token) return
      setError(null)
      try {
        const res = await api.preview(gameId, token)
        setName(res.name)
        setViewed(res.viewed)
        setCanReveal(res.can_reveal)
      } catch (err: any) {
        setError('Link not found or inactive. Please contact your organizer.')
      }
    }
    load()
  }, [gameId, token])

  const doReveal = async () => {
    if (!gameId || !token) return
    setError(null)
    try {
      const res = await api.reveal(gameId, token)
      setAssignedTo(res.assigned_to)
      setViewed(true)
    } catch (err: any) {
      setError('This link was already revealed. If needed, ask your organizer to reactivate your link.')
    }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-2">Secret Friend</h1>
        {error && <p className="text-red-300 text-sm mb-2">{error}</p>}
        {!error && (
          <div className="space-y-3">
            <p className="text-slate-200">Hi <span className="font-semibold">{name || 'friend'}</span>!</p>
            {!assignedTo && !viewed && (
              <div className="space-y-3">
                <p className="text-slate-300">Ready to reveal? Make sure no one is looking behind you.</p>
                {!canReveal && <p className="text-amber-300 text-sm">Your organizer might not have performed the draw yet. Please try again later.</p>}
                <Button onClick={async () => {
                  const ok = await confirm({
                    title: 'Confirm Reveal',
                    message: 'This will reveal your secret friend and mark your link as viewed. Continue?',
                    confirmText: 'Reveal now'
                  })
                  if (ok) doReveal()
                }} disabled={!canReveal}>I’m ready</Button>
              </div>
            )}
            {assignedTo && (
              <div className="mt-2">
                <p className="text-lg">Your secret friend is <span className="font-bold">{assignedTo}</span> 🎁</p>
              </div>
            )}
            {!assignedTo && viewed && (
              <p className="text-slate-300">This link was already used. If needed, contact your organizer.</p>
            )}
          </div>
        )}
      </GlassCard>
      
    </Layout>
  )
}
