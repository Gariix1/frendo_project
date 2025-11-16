import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { useI18n } from '../i18n/I18nProvider'
import DialogActions from './DialogActions'

type Props = {
  open: boolean
  title: string
  initialValue: string
  onSubmit: (newValue: string) => Promise<void> | void
  onClose: () => void
}

export default function RenameDialog({ open, title, initialValue, onSubmit, onClose }: Props) {
  const { t } = useI18n()
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const handleSave = async () => {
    if (!value.trim()) return
    setLoading(true)
    await onSubmit(value.trim())
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Input value={value} onChange={e => setValue(e.target.value)} />
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button onClick={handleSave} disabled={loading}>{t('buttons.save')}</Button>
        </DialogActions>
      </div>
    </Modal>
  )
}



