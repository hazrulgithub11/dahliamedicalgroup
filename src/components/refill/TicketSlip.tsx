import { useState } from 'react'

import { PillButton } from '#/components/refill/PillButton.tsx'
import {
  StatusPill,
  statusVariantFromOrderStatus,
} from '#/components/refill/StatusPill.tsx'
import type { ClinicTicket } from '#/lib/refill/staff.functions.ts'
import type { StaffAction } from '#/lib/refill/status.ts'
import { cn } from '#/lib/utils.ts'

type TicketSlipProps = {
  ticket: ClinicTicket
  emphasizeOrderId?: boolean
  pending?: boolean
  error?: string | null
  onPrimaryAction: () => void | Promise<void>
  onReject: (reason: string) => void | Promise<void>
}

const PRIMARY_LABELS: Record<ClinicTicket['status'], string> = {
  NEW: 'Accept & prepare',
  PREPARING: 'Mark as ready',
  READY: 'Completed',
}

export function TicketSlip({
  ticket,
  emphasizeOrderId = false,
  pending = false,
  error,
  onPrimaryAction,
  onReject,
}: TicketSlipProps) {
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  const canReject = ticket.status === 'NEW' || ticket.status === 'PREPARING'

  async function handleRejectConfirm() {
    const trimmed = rejectReason.trim()
    if (trimmed.length === 0) {
      setRejectError('Reject reason is required')
      return
    }

    setRejectError(null)
    try {
      await onReject(trimmed)
      setShowReject(false)
      setRejectReason('')
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function handleCancelReject() {
    setShowReject(false)
    setRejectReason('')
    setRejectError(null)
  }

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4',
        pending && 'opacity-60',
      )}
    >
      <StatusPill variant={statusVariantFromOrderStatus(ticket.status)} />

      {emphasizeOrderId ? (
        <p
          className="font-extrabold leading-none tracking-tight text-[var(--text-primary)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          #{ticket.displayId}
        </p>
      ) : (
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Order #{ticket.displayId}
        </p>
      )}

      <p className="text-lg font-medium text-[var(--text-primary)]">
        {ticket.patientName}
      </p>

      <ul className="space-y-1 text-sm text-[var(--text-primary)]">
        {ticket.items.map((item) => (
          <li key={`${item.name}-${item.strength}`}>
            {item.name} {item.strength}
          </li>
        ))}
      </ul>

      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Preferred collection
        </p>
        <p className="mt-1 text-sm text-[var(--text-primary)]">
          {new Date(ticket.preferredAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--state-error)]">{error}</p>
      ) : null}

      <PillButton
        type="button"
        disabled={pending}
        onClick={() => onPrimaryAction()}
      >
        {PRIMARY_LABELS[ticket.status]}
      </PillButton>

      {canReject && !showReject ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReject(true)}
          className="text-sm text-[var(--text-muted)] underline underline-offset-2 disabled:opacity-50"
        >
          Reject
        </button>
      ) : null}

      {canReject && showReject ? (
        <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-3">
          <input
            type="text"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Reason for rejection"
            disabled={pending}
            className="w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] disabled:opacity-50"
          />
          {rejectError ? (
            <p className="text-sm text-[var(--state-error)]">{rejectError}</p>
          ) : null}
          <div className="flex flex-col gap-2">
            <PillButton
              type="button"
              disabled={pending}
              onClick={() => void handleRejectConfirm()}
            >
              Confirm reject
            </PillButton>
            <button
              type="button"
              disabled={pending}
              onClick={handleCancelReject}
              className="text-sm text-[var(--text-muted)] underline underline-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function primaryActionForStatus(
  status: ClinicTicket['status'],
): StaffAction {
  switch (status) {
    case 'NEW':
      return { type: 'accept' }
    case 'PREPARING':
      return { type: 'ready' }
    case 'READY':
      return { type: 'complete' }
  }
}
