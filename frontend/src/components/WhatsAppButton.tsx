import { useI18n } from '../i18n/I18nProvider'

type Props = { name: string; link: string }

export default function WhatsAppButton({ name, link }: Props) {
  const { t } = useI18n()
  const text = encodeURIComponent(t('whatsapp.template', { name, url: link }))
  return (
    <a
      className="px-4 py-2 rounded-xl bg-primary hover:bg-[#74BA00] text-black shadow-[0_0_0_1px_rgba(127,206,0,0.15)]"
      target="_blank"
      rel="noreferrer"
      href={`https://wa.me/?text=${text}`}
    >
      {t('buttons.whatsapp')}
    </a>
  )
}

