import { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'

type Props = {
  open: boolean
  title: string
  label: string
  initial: string
  confirmText: string
  cancelText: string
  onClose: () => void
  onConfirm: (value: string) => void
}

export default function NameModal({ open, title, label, initial, confirmText, cancelText, onClose, onConfirm }: Props) {
  const [value, setValue] = useState(initial)
  useEffect(() => setValue(initial), [initial, open])
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">{label}</label>
          <Input value={value} onChange={e=>setValue(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
          <Button onClick={() => onConfirm(value)}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  )
}

