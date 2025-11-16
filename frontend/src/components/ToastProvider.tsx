import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }
type ToastContextType = {
  toast: (message: string, type?: Toast['type']) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type?: Toast['type']) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  const success = useCallback((message: string) => toast(message, 'success'), [toast])
  const error = useCallback((message: string) => toast(message, 'error'), [toast])
  const info = useCallback((message: string) => toast(message, 'info'), [toast])

  const api = useMemo<ToastContextType>(() => ({
    toast,
    success,
    error,
    info,
  }), [toast, success, error, info])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 inset-x-0 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 flex flex-col gap-2 items-end">
          {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto px-4 py-2 rounded-xl shadow-xl border backdrop-blur-md ${
              t.type === 'success' ? 'bg-primary/20 border-primary/30 text-slate-100' :
              t.type === 'error' ? 'bg-accent/20 border-accent/30 text-slate-100' :
              'bg-light/10 border-light/20 text-slate-100'
            }`}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
