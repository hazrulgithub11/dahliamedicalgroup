import type { ReactNode } from 'react'

import { cn } from '#/lib/utils.ts'

type ResultCardProps = {
  children: ReactNode
  className?: string
}

export function ResultCard({ children, className }: ResultCardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] bg-[var(--bg-surface)] p-5 shadow-[0_1px_0_var(--border-default)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
