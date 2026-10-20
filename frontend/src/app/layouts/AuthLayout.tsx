import { ReactNode } from 'react'
import { LanguageMenu } from '@/features/switch-language'

/** Public auth screens (sign in, register, reset …): language menu in the top corner. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed end-4 top-4 z-10">
        <LanguageMenu />
      </div>
      {children}
    </>
  )
}
