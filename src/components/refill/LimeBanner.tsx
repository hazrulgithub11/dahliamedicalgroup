import type { ReactNode } from 'react'

import { cn } from '#/lib/utils.ts'

type LimeBannerProps = {
  label: string
  rightSlot?: ReactNode
  className?: string
}

export function LimeBanner({ label, rightSlot, className }: LimeBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 bg-[var(--bg-lime)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]',
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {rightSlot}
    </div>
  )
}
