import Badge from './Badge'
import { useI18n } from '../i18n/I18nProvider'

type Props = {
  active: boolean
  viewed?: boolean
}

export default function StatusPills({ active, viewed }: Props) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1">
      <Badge color={active ? 'primary' : 'neutral'}>{active ? t('status.active') : t('status.inactive')}</Badge>
      {viewed ? <Badge color="light">{t('status.viewed')}</Badge> : null}
    </div>
  )
}

