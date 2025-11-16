import Button from './Button'
import StatusBadge from './StatusBadge'
import Input from './Input'

export type GameCardStatus = {
  label: string
  variant: 'active' | 'inactive' | 'revealed'
}

type ActionConfig = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'ghost' | 'accent'
}

type Props = {
  title: string
  subtitle: string
  statuses: GameCardStatus[]
  actions: ActionConfig[]
  adminPassword?: string
  onAdminPasswordChange?: (value: string) => void
  passwordPlaceholder?: string
}

export default function GameCard({
  title,
  subtitle,
  statuses,
  actions,
  adminPassword,
  onAdminPasswordChange,
  passwordPlaceholder,
}: Props) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 lg:p-5 shadow-[25px_25px_60px_rgba(1,5,21,0.45),-10px_-10px_30px_rgba(255,255,255,0.05)] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex-1 space-y-3 pr-0 lg:pr-6">
        <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
          <span>{title}</span>
          {statuses.map((status, idx) => (
            <StatusBadge key={`${status.label}-${idx}`} label={status.label} variant={status.variant} />
          ))}
        </div>
        <p className="text-xs text-white/70">{subtitle}</p>
        {onAdminPasswordChange && (
          <Input
            value={adminPassword || ''}
            placeholder={passwordPlaceholder}
            onChange={e => onAdminPasswordChange(e.target.value)}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs lg:max-w-sm lg:grid-cols-1">
        {actions.map(action => (
          <Button key={action.label} variant={action.variant ?? 'ghost'} onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
