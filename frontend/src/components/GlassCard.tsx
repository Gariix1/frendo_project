import { PropsWithChildren } from 'react'

export default function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-[32px] p-6 md:p-8 border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[25px_25px_60px_rgba(1,5,21,0.55),-10px_-10px_30px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.45)]">
      {children}
    </div>
  )
}
