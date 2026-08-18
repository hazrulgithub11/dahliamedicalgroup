import { cn } from '#/lib/utils.ts'

type WhatsAppPreviewProps = {
  displayId: number
  clinicName: string
  readyAt: string | null
  className?: string
}

function formatReadyAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function WhatsAppPreview({
  displayId,
  clinicName,
  readyAt,
  className,
}: WhatsAppPreviewProps) {
  return (
    <div
      className={cn(
        'relative z-10 max-w-[min(100%,280px)] rounded-[24px] rounded-bl-md bg-[var(--state-ok-bg)] px-4 py-3 text-[var(--state-ok-text)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <p className="text-sm leading-relaxed">
        Your refill #{displayId} is ready for pickup at {clinicName}. Show this
        number at the Pre-Order Pick Up counter.
      </p>
      {readyAt ? (
        <p className="mt-2 text-xs opacity-80">{formatReadyAt(readyAt)}</p>
      ) : null}
    </div>
  )
}
