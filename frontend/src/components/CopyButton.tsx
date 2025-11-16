import Button from './Button'
import { copyText } from '../lib/clipboard'
import { useI18n } from '../i18n/I18nProvider'

type Props = { text: string; className?: string }

export default function CopyButton({ text, className }: Props) {
  const { t } = useI18n()
  return (
    <Button className={className} variant="ghost" onClick={() => copyText(text)}>
      {t('buttons.copy')}
    </Button>
  )
}

