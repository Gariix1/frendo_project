import { FormEvent, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n/I18nProvider'
import Button from './Button'


type Suggestion = {
  title: string
  reason: string
  estimated_price?: number | null
}

type Props = {
  gameId: string
  token: string
  sessionToken: string
}

export default function GiftAssistant({ gameId, token, sessionToken }: Props) {
  const { locale, t } = useI18n()
  const [budget, setBudget] = useState('25')
  const [interests, setInterests] = useState('')
  const [relationship, setRelationship] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipient, setRecipient] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [rules, setRules] = useState<string[]>([])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numericBudget = Number(budget)
    if (!Number.isFinite(numericBudget) || numericBudget < 1) {
      setError(t('ai.invalidBudget'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await api.giftSuggestions(gameId, token, {
        sessionToken,
        budget: numericBudget,
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean),
        relationship: relationship.trim() || undefined,
        notes: notes.trim() || undefined,
        count: 5,
        language: locale,
      })
      setRecipient(result.recipient || '')
      setSuggestions(result.suggestions || [])
      setRules(result.deterministic_rules || [])
    } catch (err: any) {
      if (err?.code === 'ai_not_configured') {
        setError(t('ai.notConfigured'))
      } else if (err?.code === 'ai_session_expired' || err?.code === 'ai_session_invalid') {
        setError(t('ai.sessionExpired'))
      } else if (err?.code === 'ai_session_limit') {
        setError(t('ai.sessionLimit'))
      } else {
        setError(t('ai.failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/15 via-slate-900/25 to-cyan-400/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="mb-4">
        <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-200">
          {t('ai.badge')}
        </span>
        <h2 className="mt-3 text-xl font-semibold text-white">{t('ai.title')}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{t('ai.description')}</p>
      </div>

      <form className="space-y-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-200">
            {t('ai.budget')}
            <input
              type="number"
              min="1"
              step="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-white outline-none focus:border-violet-300/50"
            />
          </label>
          <label className="text-sm text-slate-200">
            {t('ai.relationship')}
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder={t('ai.relationshipPlaceholder')}
              maxLength={80}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-white outline-none focus:border-violet-300/50"
            />
          </label>
        </div>

        <label className="block text-sm text-slate-200">
          {t('ai.interests')}
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder={t('ai.interestsPlaceholder')}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-white outline-none focus:border-violet-300/50"
          />
        </label>

        <label className="block text-sm text-slate-200">
          {t('ai.notes')}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('ai.notesPlaceholder')}
            maxLength={500}
            rows={3}
            className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-white outline-none focus:border-violet-300/50"
          />
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t('ai.generating') : t('ai.generate')}</Button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-white">{t('ai.results', { name: recipient })}</h3>
          <div className="mt-3 space-y-3">
            {suggestions.map((suggestion, index) => (
              <article key={`${suggestion.title}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-white">{suggestion.title}</p>
                  {suggestion.estimated_price != null && (
                    <span className="whitespace-nowrap rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      ~${suggestion.estimated_price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{suggestion.reason}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{t('ai.engineeringNote')}</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
            {rules.map((rule) => <li key={rule}>• {rule}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
