import { PropsWithChildren } from 'react'

export default function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-5 md:p-6">
      {children}
    </div>
  )
}
