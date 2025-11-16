import { useId } from 'react'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Layout from '../components/Layout'
import PeoplePicker from '../components/PeoplePicker'
import Input from '../components/Input'
import { useI18n } from '../i18n/I18nProvider'
import { useCreateGameForm } from '../hooks/useCreateGameForm'
import FormField from '../components/FormField'
import Chip from '../components/Chip'

export default function CreateGame() {
  const { t } = useI18n()
  const titleId = useId()
  const passwordId = useId()
  const {
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
  } = useCreateGameForm(t('brand.title'))
  const hasSelection = participantCount > 0

  return (
    <Layout>
      <GlassCard>
        <h1 className="text-2xl font-semibold mb-4">{t('create.title')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('create.form.title')} htmlFor={titleId}>
            <Input id={titleId} value={title} onChange={e=>setTitle(e.target.value)} />
          </FormField>
          <FormField label={t('create.form.password')} htmlFor={passwordId}>
            <Input id={passwordId} type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </FormField>
          <FormField
            label={t('create.form.participants')}
            actions={
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={openPicker}>{t('create.pickFromDirectory')}</Button>
                <span className="text-sm text-slate-300">{t('common.selectedCount', { count: participantCount })}</span>
              </div>
            }
          >
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-300">{t('create.selectionSummary')}</p>
              {hasSelection ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPeople.map(person => (
                    <Chip
                      key={person.id}
                      label={person.name}
                      onRemove={() => removeSelectedPerson(person.id)}
                      removeLabel={t('create.removeParticipant', { name: person.name })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t('create.noParticipantsSelected')}</p>
              )}
            </div>
          </FormField>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <Button type="submit" disabled={loading || participantCount < 3}>{loading ? t('buttons.creating') : t('buttons.create')}</Button>
        </form>
      </GlassCard>
      <PeoplePicker
        open={pickerOpen}
        onClose={closePicker}
        onConfirm={handlePickerConfirm}
        initialSelected={selectedIds}
      />
    </Layout>
  )
}
