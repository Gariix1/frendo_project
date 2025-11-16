import AnimatedText from './AnimatedText'

type Props = {
  text: string
  onClick?: () => void
}

export default function Tag({ text, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 font-mono text-[11px] text-slate-100 break-all bg-white/10 rounded-full px-3 py-1 border border-white/30 select-all hover:bg-white/15"
      title={text}
    >
      <span className="truncate max-w-[70vw] sm:max-w-[28rem]">
        <AnimatedText watch={text}>{text}</AnimatedText>
      </span>
    </button>
  )
}
