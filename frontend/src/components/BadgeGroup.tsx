import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function BadgeGroup({ children }: Props) {
  return <div className="flex items-center gap-1 flex-wrap">{children}</div>
}

