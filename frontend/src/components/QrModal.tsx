import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import QRCode from 'qrcode'
import { useI18n } from '../i18n/I18nProvider'

type Props = {
  open: boolean
  onClose: () => void
  link: string | null
  title?: string
}

export default function QrModal({ open, onClose, link, title }: Props) {
  const { t } = useI18n()
  const [src, setSrc] = useState<string>('')

  useEffect(() => {
    let active = true
    async function gen() {
      if (!open || !link) { setSrc(''); return }
      try {
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, scale: 6, color: { dark: '#ffffff', light: '#00000000' } })
        if (active) setSrc(dataUrl)
      } catch {
        if (active) setSrc('')
      }
    }
    gen()
    return () => { active = false }
  }, [open, link])

  return (
    <Modal open={open} onClose={onClose} title={title || t('qr.title')}>
      {src ? (
        <div className="flex flex-col items-center gap-3">
          <img src={src} alt="QR" className="w-64 h-64 rounded-xl bg-white/5 p-2" />
          <div className="text-xs break-all opacity-80 text-center">{link}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(link || '')}>{t('qr.copyLink')}</Button>
            <Button onClick={onClose}>{t('buttons.close')}</Button>
          </div>
        </div>
      ) : (
        <div className="text-sm opacity-80">{t('qr.generating')}</div>
      )}
    </Modal>
  )
}

