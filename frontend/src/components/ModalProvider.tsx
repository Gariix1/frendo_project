import React, { createContext, PropsWithChildren, useCallback, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Modal from './Modal'
import Button from './Button'
import { useI18n } from '../i18n/I18nProvider'

type DialogVariant = 'default' | 'primary' | 'danger' | 'success'

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

type AlertOptions = {
  title?: string
  message: string
  confirmText?: string
  variant?: DialogVariant
}

type ModalContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  alert: (opts: AlertOptions) => Promise<void>
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

type DialogState =
  | { type: 'confirm'; options: ConfirmOptions }
  | { type: 'alert'; options: AlertOptions }
  | null

export default function ModalProvider({ children }: PropsWithChildren) {
  const { t } = useI18n()
  const location = useLocation()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [confirmResolver, setConfirmResolver] = useState<((v: boolean) => void) | null>(null)
  const [alertResolver, setAlertResolver] = useState<(() => void) | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => {
    setDialog({ type: 'confirm', options: o })
    return new Promise<boolean>((resolve) => {
      setConfirmResolver(() => resolve)
    })
  }, [])

  const alert = useCallback((o: AlertOptions) => {
    setDialog({ type: 'alert', options: o })
    return new Promise<void>((resolve) => {
      setAlertResolver(() => resolve)
    })
  }, [])

  const closeConfirm = useCallback((value: boolean) => {
    setDialog(null)
    if (confirmResolver) confirmResolver(value)
    setConfirmResolver(null)
  }, [confirmResolver])

  const closeAlert = useCallback(() => {
    setDialog(null)
    if (alertResolver) alertResolver()
    setAlertResolver(null)
  }, [alertResolver])

  useEffect(() => {
    if (!dialog) return
    if (dialog.type === 'confirm') {
      closeConfirm(false)
    } else if (dialog.type === 'alert') {
      closeAlert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
        <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog?.type === 'confirm' && (
        <Modal
          open
          onClose={() => closeConfirm(false)}
          title={dialog.options.title || t('modal.confirmTitle')}
          variant={dialog.options.variant}
          size="sm"
        >
          <p className="text-slate-200">{dialog.options.message}</p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => closeConfirm(false)}>{dialog.options.cancelText || t('buttons.cancel')}</Button>
            <Button onClick={() => closeConfirm(true)}>{dialog.options.confirmText || t('buttons.confirm')}</Button>
          </div>
        </Modal>
      )}
      {dialog?.type === 'alert' && (
        <Modal
          open
          onClose={closeAlert}
          title={dialog.options.title || t('modal.confirmTitle')}
          variant={dialog.options.variant}
          size="sm"
        >
          <p className="text-slate-200">{dialog.options.message}</p>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={closeAlert}>{dialog.options.confirmText || t('common.ok')}</Button>
          </div>
        </Modal>
      )}
    </ModalContext.Provider>
  )
}
