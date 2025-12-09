import Modal from './Modal'
import Button from './Button'
import { useI18n } from '../i18n/I18nProvider'
import DialogActions from './DialogActions'

type Variant = 'default' | 'primary' | 'danger' | 'success'

type Props = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
  variant?: Variant
  confirmVariant?: 'primary' | 'accent' | 'danger'
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  variant = 'default',
  confirmVariant = 'accent',
}: Props) {
  const { t } = useI18n()

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} variant={variant} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-white/80">{message}</p>
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>{cancelText || t('buttons.cancel')}</Button>
          <Button variant={confirmVariant === 'danger' ? 'accent' : confirmVariant} onClick={handleConfirm}>{confirmText || t('common.ok')}</Button>
        </DialogActions>
      </div>
    </Modal>
  )
}
