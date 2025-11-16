import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import StatusBadge from './StatusBadge'
import BadgeGroup from './BadgeGroup'
import { useI18n } from '../i18n/I18nProvider'
import AnimatedText from './AnimatedText'
import DialogActions from './DialogActions'

type Participant = { id: string; name: string; token: string; active: boolean; viewed: boolean }

type Props = {
  open: boolean
  onClose: () => void
  participant: Participant | null
  canRemove: boolean
  onRename: (name: string) => Promise<void>
  onToggle: () => Promise<void>
  onRemove: () => Promise<void>
}

export default function ManageParticipantModal({ open, onClose, participant, canRemove, onRename, onToggle, onRemove }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { setName(participant?.name || '') }, [participant])

  if (!participant) return null

  return (
    <Modal open={open} onClose={onClose} title={t('manage.title')}>
      <div className="space-y-3">
        <BadgeGroup>
          <StatusBadge label={participant.active ? t('manage.active') : t('manage.inactive')} variant={participant.active ? 'active' : 'inactive'} />
          {participant.viewed && <StatusBadge label={t('status.viewed')} variant="viewed" />}
        </BadgeGroup>
        <div>
          <label className="block text-sm mb-1">
            <AnimatedText>{t('manage.nameLabel')}</AnimatedText>
          </label>
          <Input value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <DialogActions wrap className="items-center">
          <Button onClick={async () => { if (name.trim() && name.trim() !== participant.name) { setLoading(true); await onRename(name.trim()); setLoading(false) } }} disabled={loading}>{t('buttons.save')}</Button>
          <Button variant="accent" onClick={async () => { setLoading(true); await onToggle(); setLoading(false) }}>{participant.active ? t('buttons.deactivate') : t('buttons.reactivate')}</Button>
          {canRemove && <Button variant="accent" onClick={async () => { setLoading(true); await onRemove(); setLoading(false) }}>{t('buttons.remove')}</Button>}
          <Button variant="ghost" onClick={onClose}>{t('buttons.close')}</Button>
        </DialogActions>
        {canRemove && <p className="text-xs text-slate-300"><AnimatedText>{t('manage.removeHelp')}</AnimatedText></p>}
      </div>
    </Modal>
  )
}
