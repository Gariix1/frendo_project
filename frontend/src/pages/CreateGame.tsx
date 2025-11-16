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
import HeroCard from '../components/HeroCard'
import { validationRules } from '../lib/validation'

export default function CreateGame() {
  const { t } = useI18n()
  const titleId = useId()
  const passwordId = useId()
  const minParticipants = validationRules.game.minParticipants
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
      <HeroCard
        eyebrow={t('brand.title')}
        title={t('create.title')}
        description={t('create.heroCopy', { defaultValue: 'Organiza el intercambio perfecto con un tablero moderno, enlaces mágicos y una presentación digna de clay art.' })}
        actions={<Button onClick={openPicker} type="button">{t('create.pickFromDirectory')}</Button>}
      />

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <p className="text-xs uppercase tracking-wide text-white/70">{t('create.selectionSummary')}</p>
              {hasSelection ? (
                <div className="flex flex-wrap gap-3">
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
                <p className="text-sm text-white/70">{t('create.noParticipantsSelected')}</p>
              )}
            </div>
          </FormField>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <Button type="submit" disabled={loading || participantCount < minParticipants}>{loading ? t('buttons.creating') : t('buttons.create')}</Button>
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
