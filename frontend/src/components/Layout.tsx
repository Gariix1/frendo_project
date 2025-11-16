import { PropsWithChildren } from 'react'

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto space-y-6 max-w-4xl w-full">
      {children}
    </div>
  )
}
