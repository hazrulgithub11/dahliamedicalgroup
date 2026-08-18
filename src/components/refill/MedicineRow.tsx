import { cn } from '#/lib/utils.ts'

type MedicineRowProps = {
  name: string
  strength: string
  selected: boolean
  onToggle: () => void
}

export function MedicineRow({
  name,
  strength,
  selected,
  onToggle,
}: MedicineRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors',
        selected
          ? 'border-[var(--text-primary)] bg-[var(--bg-base)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
          selected
            ? 'border-[var(--text-primary)] bg-[var(--text-primary)]'
            : 'border-[var(--border-default)] bg-[var(--bg-surface)]',
        )}
        aria-hidden
      >
        {selected ? (
          <span className="h-2 w-2 rounded-sm bg-white" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium leading-snug text-[var(--text-primary)]">
          {name}
        </span>
        <span className="block text-sm text-[var(--text-muted)]">{strength}</span>
      </span>
    </button>
  )
}
