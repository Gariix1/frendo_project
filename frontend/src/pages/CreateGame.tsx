import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import { api } from '../lib/api'
import PeoplePicker from '../components/PeoplePicker'
import Input from '../components/Input'
import { useI18n } from '../i18n/I18nProvider'

export default function CreateGame() {
  const { t } = useI18n()
  const [title, setTitle] = useState('Amigo Secreto')
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
      setError(t('errors.pickAtLeast3'))
      return
    }
    setLoading(true)
    try {
      const res = await api.createGameByPeople(title, password, selectedIds)
      try { localStorage.setItem(`adminpw:${res.game_id}`, password) } catch {}
      navigate(`/game/${res.game_id}/links`)
    } catch (err: any) {
      setError(err.message || t('errors.failedCreateGame'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-4">{t('create.title')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('create.form.title')}</label>
            <Input value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('create.form.password')}</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('create.form.participants')}</label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={()=>setPickerOpen(true)}>{t('create.pickFromDirectory')}</Button>
              <span className="text-sm text-slate-300">{t('common.selectedCount', { count: selectedIds.length })}</span>
            </div>
          </div>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <Button type="submit" disabled={loading || selectedIds.length < 3}>{loading ? t('buttons.creating') : t('buttons.create')}</Button>
        </form>
      </GlassCard>
      <PeoplePicker open={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={(ids)=>{ setSelectedIds(ids); setPickerOpen(false) }} />
    </Layout>
  )
}
