import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../i18n/I18nProvider'
import { validationRules, validators, formatValidationError, normalizeWhitespace } from '../lib/validation'

type SelectedPerson = { id: string; name: string; source: 'directory' | 'manual'; personId?: string }

type PickerSelection = {
  ids: string[]
  people: { id: string; name: string }[]
}

export function useCreateGameForm(initialTitle = 'Amigo Secreto') {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [title, setTitle] = useState(initialTitle)
  const [password, setPassword] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedPeople, setSelectedPeople] = useState<SelectedPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedDirectoryIds = useMemo(
    () => selectedPeople.filter(person => person.source === 'directory' && person.personId).map(person => person.personId!) ,
    [selectedPeople],
  )
  const participantCount = selectedPeople.length
  const minParticipants = validationRules.game.minParticipants

  const normalizeError = useCallback(
    (err: any) => {
      const status = err?.status
      const code = err?.code
      const detail = `${err?.message || ''}`.toLowerCase()
      if (status === 400) {
        if (code === 'game_min_participants') return t('validation.minParticipants', { min: minParticipants })
        if (code === 'person_not_found') return t('errors.personNotFoundOrInactive')
        if (code === 'duplicate_participant_names') return t('errors.duplicateNames')
        if (detail.includes('person id not found')) return t('errors.personNotFoundOrInactive')
        if (detail.includes('inactive')) return t('errors.personNotFoundOrInactive')
        if (detail.includes('duplicate') || detail.includes('empty names')) return t('errors.duplicateNames')
      }
      if (status === 409) return t('errors.gameCreationConflict')
      return err?.message || t('errors.failedCreateGame')
    },
    [t, minParticipants],
  )

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault()
      setError(null)
      if (participantCount < minParticipants) {
        setError(t('validation.minParticipants', { min: minParticipants }))
        return
      }
      const titleError = validators.title(title)
      if (titleError) {
        setError(formatValidationError(titleError, t))
        return
      }
      const passwordError = validators.adminPassword(password)
      if (passwordError) {
        setError(formatValidationError(passwordError, t))
        return
      }
      setLoading(true)
      try {
        const normalizedTitle = normalizeWhitespace(title) || initialTitle
        const normalizedPassword = password.trim()
        const personIds = selectedPeople.filter(p => p.source === 'directory' && p.personId).map(p => p.personId as string)
        const manualNames = selectedPeople.filter(p => p.source === 'manual').map(p => p.name)
        const res = await api.createGame(normalizedTitle, normalizedPassword, { personIds, participants: manualNames })
        try {
          localStorage.setItem(`adminpw:${res.game_id}`, normalizedPassword)
        } catch {
          /* ignore storage failures */
        }
        navigate(`/game/${res.game_id}/links`)
      } catch (err: any) {
        setError(normalizeError(err))
      } finally {
        setLoading(false)
      }
    },
    [participantCount, t, title, initialTitle, password, selectedPeople, navigate, normalizeError, minParticipants],
  )

  const handlePickerConfirm = useCallback((selection: PickerSelection) => {
    setSelectedPeople(prev => {
      const manualEntries = prev.filter(person => person.source === 'manual')
      const merged = selection.people.map(person => ({
        id: person.id,
        personId: person.id,
        name: person.name,
        source: 'directory' as const,
      }))
      const seen = new Set(manualEntries.map(p => p.name.toLowerCase()))
      const dedupedMerged = merged.filter(p => {
        const key = p.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      return [...manualEntries, ...dedupedMerged]
    })
    setPickerOpen(false)
  }, [])

  const removeSelectedPerson = useCallback((personId: string) => {
    setSelectedPeople(prev => prev.filter(person => person.id !== personId))
  }, [])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

  const addManualParticipant = useCallback(
    (name: string): string | null => {
      const normalized = normalizeWhitespace(name)
      if (!normalized) {
        return formatValidationError({ key: 'validation.required', fieldKey: 'fields.participantName' }, t)
      }
      const validationError = validators.participantName(normalized)
      if (validationError) {
        return formatValidationError(validationError, t)
      }
      const exists = selectedPeople.some(person => person.name.toLowerCase() === normalized.toLowerCase())
      if (exists) {
        return t('errors.duplicateNames')
      }
      setSelectedPeople(prev => [
        ...prev,
        {
          id: `manual-${Date.now()}-${prev.length}`,
          name: normalized,
          source: 'manual',
        },
      ])
      return null
    },
    [selectedPeople, t],
  )

  return {
    title,
    setTitle,
    password,
    setPassword,
    pickerOpen,
    openPicker,
    closePicker,
    handlePickerConfirm,
    selectedPeople,
    selectedDirectoryIds,
    participantCount,
    handleSubmit,
    loading,
    error,
    removeSelectedPerson,
    addManualParticipant,
  }
}
