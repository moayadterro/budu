import { ReactNode } from 'react'

/** Public auth screens (sign in, register, reset …) — each page renders `AuthShell` (widgets/auth-shell). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
