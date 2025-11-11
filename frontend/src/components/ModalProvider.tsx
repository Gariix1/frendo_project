import React, { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react'
import Modal from './Modal'
import Button from './Button'

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

type ModalContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export default function ModalProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({ message: '' })
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handle = (value: boolean) => {
    setOpen(false)
    if (resolver) resolver(value)
    setResolver(null)
  }

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      <Modal open={open} onClose={() => handle(false)} title={opts.title || 'Confirm'}>
        <p className="text-slate-200">{opts.message}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => handle(false)}>{opts.cancelText || 'Cancel'}</Button>
          <Button onClick={() => handle(true)}>{opts.confirmText || 'Confirm'}</Button>
        </div>
      </Modal>
    </ModalContext.Provider>
  )
}

