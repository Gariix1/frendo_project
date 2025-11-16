import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../i18n/I18nProvider'

type SelectedPerson = { id: string; name: string }

type PickerSelection = {
  ids: string[]
  people: SelectedPerson[]
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

  const selectedIds = useMemo(() => selectedPeople.map(person => person.id), [selectedPeople])
  const participantCount = selectedIds.length

  const normalizeError = useCallback(
    (err: any) => {
      const status = err?.status
      const detail = `${err?.message || ''}`.toLowerCase()
      if (status === 400) {
        if (detail.includes('at least 3')) return t('errors.pickAtLeast3')
        if (detail.includes('person id not found')) return t('errors.personNotFoundOrInactive')
        if (detail.includes('inactive')) return t('errors.personNotFoundOrInactive')
        if (detail.includes('duplicate') || detail.includes('empty names')) return t('errors.duplicateNames')
      }
      if (status === 409) return t('errors.gameCreationConflict')
      return err?.message || t('errors.failedCreateGame')
    },
    [t],
  )

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault()
      setError(null)
      if (participantCount < 3) {
        setError(t('errors.pickAtLeast3'))
        return
      }
      setLoading(true)
      try {
        const res = await api.createGameByPeople(title.trim() || initialTitle, password, selectedIds)
        try {
          localStorage.setItem(`adminpw:${res.game_id}`, password)
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
    [participantCount, t, title, initialTitle, password, selectedIds, navigate, normalizeError],
  )

  const handlePickerConfirm = useCallback((selection: PickerSelection) => {
    setSelectedPeople(selection.people)
    setPickerOpen(false)
  }, [])

  const removeSelectedPerson = useCallback((personId: string) => {
    setSelectedPeople(prev => prev.filter(person => person.id !== personId))
  }, [])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

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
    selectedIds,
    participantCount,
    handleSubmit,
    loading,
    error,
    removeSelectedPerson,
  }
}

