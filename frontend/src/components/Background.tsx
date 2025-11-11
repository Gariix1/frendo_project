export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base gradient (covers any screen size) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-900" />

      {/* Soft blobs for depth (static for performance) */}
      <div className="absolute -top-24 -left-24 h-[36rem] w-[36rem] bg-emerald-600/25 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 -right-28 h-[28rem] w-[28rem] bg-purple-600/20 rounded-full blur-[110px]" />
      <div className="absolute -bottom-32 left-1/4 h-[32rem] w-[32rem] bg-cyan-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-1/4 h-[22rem] w-[22rem] bg-emerald-400/15 rounded-full blur-[90px]" />
    </div>
  )
}

