import Button from './Button'
import StatusBadge from './StatusBadge'

type Props = {
  name: string
  status: 'active' | 'inactive'
  secondaryStatus?: 'revealed' | 'viewed'
  description?: React.ReactNode
  inlineContent?: React.ReactNode
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'ghost' | 'accent' }[]
  rightContent?: React.ReactNode
}

export default function ParticipantRow({
  name,
  status,
  secondaryStatus,
  description,
  inlineContent,
  actions = [],
  rightContent,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-2xl bg-white/5 border border-white/15">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{name}</span>
          <StatusBadge label={status === 'active' ? 'active' : 'inactive'} variant={status} />
          {secondaryStatus && <StatusBadge label={secondaryStatus} variant={secondaryStatus === 'viewed' ? 'viewed' : 'revealed'} />}
        </div>
        {description && <div className="text-xs text-white/70 truncate">{description}</div>}
        {inlineContent && <div>{inlineContent}</div>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map(action => (
          <Button key={action.label} variant={action.variant ?? 'ghost'} onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
        {rightContent}
      </div>
    </div>
  )
}
