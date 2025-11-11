import { PropsWithChildren } from 'react'

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto space-y-4 max-w-md md:max-w-xl lg:max-w-2xl">
      {children}
    </div>
  )
}
