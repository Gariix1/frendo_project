export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base solid background (Drab Dark Brown) */}
      <div className="absolute inset-0 bg-dark" />

      {/* Soft blobs using palette colors (static for performance) */}
      <div className="absolute -top-24 -left-24 h-[36rem] w-[36rem] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 -right-28 h-[28rem] w-[28rem] bg-accent/20 rounded-full blur-[110px]" />
      <div className="absolute -bottom-32 left-1/4 h-[32rem] w-[32rem] bg-light/25 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-1/4 h-[22rem] w-[22rem] bg-primary/15 rounded-full blur-[90px]" />
    </div>
  )
}
