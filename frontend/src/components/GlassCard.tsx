import { PropsWithChildren } from 'react'

export default function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-3xl p-5 md:p-6 border border-white/15 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.35)]">
      {children}
    </div>
  )
}
