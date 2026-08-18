import { cn } from '#/lib/utils.ts'

type StatusVariant = 'received' | 'preparing' | 'ready' | 'declined'

const VARIANTS: Record<
  StatusVariant,
  { label: string; dot: string; bg: string; text: string }
> = {
  received: {
    label: 'Received',
    dot: 'bg-[var(--bg-lime)]',
    bg: 'bg-[var(--bg-lime)]/30',
    text: 'text-[var(--text-primary)]',
  },
  preparing: {
    label: 'Preparing',
    dot: 'bg-[var(--bg-slate)]',
    bg: 'bg-[var(--bg-slate)]/20',
    text: 'text-[var(--text-primary)]',
  },
  ready: {
    label: 'Ready for pickup',
    dot: 'bg-[var(--state-ok-text)]',
    bg: 'bg-[var(--state-ok-bg)]',
    text: 'text-[var(--state-ok-text)]',
  },
  declined: {
    label: 'Declined',
    dot: 'bg-[var(--state-error)]',
    bg: 'bg-[var(--state-error)]/10',
    text: 'text-[var(--state-error)]',
  },
}

type StatusPillProps = {
  variant: StatusVariant
  className?: string
}

export function StatusPill({ variant, className }: StatusPillProps) {
  const config = VARIANTS[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dot)} aria-hidden />
      {config.label}
    </span>
  )
}

export function statusVariantFromOrderStatus(
  status: 'NEW' | 'PREPARING' | 'READY' | 'REJECTED',
): StatusVariant {
  switch (status) {
    case 'NEW':
      return 'received'
    case 'PREPARING':
      return 'preparing'
    case 'READY':
      return 'ready'
    case 'REJECTED':
      return 'declined'
  }
}
