import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'

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
  const [seq, setSeq] = useState(1)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const api = useMemo<ToastContextType>(() => ({
    toast: (message, type) => {
      const id = seq
      setSeq(id + 1)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => remove(id), 3000)
    },
    success: (m) => api.toast(m, 'success'),
    error: (m) => api.toast(m, 'error'),
    info: (m) => api.toast(m, 'info'),
  }), [seq, remove])

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
