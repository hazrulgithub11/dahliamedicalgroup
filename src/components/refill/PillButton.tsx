import type { ButtonHTMLAttributes } from 'react'

import { cn } from '#/lib/utils.ts'

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean
}

export function PillButton({
  className,
  fullWidth = true,
  type = 'button',
  children,
  ...props
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent-primary)] px-6 text-base font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
