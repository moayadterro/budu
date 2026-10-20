'use client'

import { InputHTMLAttributes, useState } from 'react'
import { Icon } from './icon'
import { Input } from './input'
import { cn } from '@/shared/lib/cn'
import { t } from '@/shared/i18n'

/** Password field with a show/hide toggle. Takes every <input> prop except `type`. */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pe-10', className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t.hidePassword : t.showPassword}
        aria-pressed={visible}
        title={visible ? t.hidePassword : t.showPassword}
        className="absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-primary focus-visible:outline-none"
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} className="size-4" />
      </button>
    </div>
  )
}
