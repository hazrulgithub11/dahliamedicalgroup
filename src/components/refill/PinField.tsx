import type { FormEvent } from 'react'

import { PillButton } from '#/components/refill/PillButton.tsx'
import { cn } from '#/lib/utils.ts'

type PinFieldProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void | Promise<void>
  error?: string | null
  submitting?: boolean
  className?: string
}

export function PinField({
  value,
  onChange,
  onSubmit,
  error,
  submitting = false,
  className,
}: PinFieldProps) {
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting || value.length === 0) {
      return
    }
    await onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full max-w-sm flex-col gap-4', className)}
    >
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={submitting}
        aria-label="Staff PIN"
        className="min-h-[3.5rem] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-center text-2xl tracking-[0.3em] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] disabled:opacity-50"
      />

      {error ? (
        <p className="text-center text-sm text-[var(--state-error)]">{error}</p>
      ) : null}

      <PillButton type="submit" disabled={submitting || value.length === 0}>
        {submitting ? 'Signing in…' : 'Enter'}
      </PillButton>
    </form>
  )
}
