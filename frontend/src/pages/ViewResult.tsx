import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import ConfirmDialog from '../components/ConfirmDialog'
import { useI18n } from '../i18n/I18nProvider'
export default function ViewResult() {
  const { gameId, token } = useParams()
  const [name, setName] = useState('')
  const [viewed, setViewed] = useState(false)
  const [canReveal, setCanReveal] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const { t } = useI18n()

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
        setError(t('errors.linkNotFound'))
      }
    }
    load()
  }, [gameId, token, t])

  const doReveal = async () => {
    if (!gameId || !token) return
    setError(null)
    try {
      const res = await api.reveal(gameId, token)
      setAssignedTo(res.assigned_to)
      setViewed(true)
    } catch (err: any) {
      setError(t('view.alreadyUsed'))
    }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-2">{t('brand.title')}</h1>
        {error && <p className="text-red-300 text-sm mb-2">{error}</p>}
        {!error && (
          <div className="space-y-3">
            <p className="text-slate-200">{name ? t('view.greeting', { name }) : t('view.greetingFallback')}</p>
            {!assignedTo && !viewed && (
              <div className="space-y-3">
                <p className="text-slate-300">{t('view.ready')}</p>
                {!canReveal && <p className="text-amber-300 text-sm">{t('view.notReady')}</p>}
                <Button onClick={() => setConfirmReveal(true)} disabled={!canReveal}>{t('view.cta')}</Button>
              </div>
            )}
            {assignedTo && (
              <div className="mt-2">
                <p className="text-lg">{t('view.result', { name: assignedTo })}</p>
              </div>
            )}
            {!assignedTo && viewed && (
              <p className="text-slate-300">{t('view.alreadyUsed')}</p>
            )}
          </div>
        )}
      </GlassCard>
      <ConfirmDialog
        open={confirmReveal}
        title={t('view.confirmTitle')}
        message={t('view.confirmMessage')}
        confirmText={t('view.confirmCta')}
        variant="primary"
        onConfirm={doReveal}
        onClose={() => setConfirmReveal(false)}
      />
    </Layout>
  )
}
