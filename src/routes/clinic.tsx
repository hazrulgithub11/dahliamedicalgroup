import { useState } from 'react'

import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { LimeBanner } from '#/components/refill/LimeBanner.tsx'
import { PinField } from '#/components/refill/PinField.tsx'
import {
  primaryActionForStatus,
  TicketSlip,
} from '#/components/refill/TicketSlip.tsx'
import {
  applyOrderAction,
  getClinicPage,
  type ClinicPage,
  type ClinicTicket,
} from '#/lib/refill/staff.functions.ts'
import { loginStaff, logoutStaff } from '#/lib/refill/session.functions.ts'
import { useProductPoll } from '#/lib/refill/useProductPoll.ts'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/clinic')({
  head: () => ({
    meta: [
      {
        title: 'Clinic · Dahlia Medical Group',
      },
    ],
  }),
  loader: () => getClinicPage(),
  component: Clinic,
})

function Clinic() {
  const data = Route.useLoaderData()
  useProductPoll(data.screen === 'board')

  if (data.screen === 'pin') {
    return <PinView />
  }

  return <BoardView clinicName={data.clinic.name} columns={data.columns} />
}

type ProductBarProps = {
  showLogout?: boolean
  loggingOut?: boolean
  onLogout?: () => void
}

function ProductBar({ showLogout, loggingOut, onLogout }: ProductBarProps) {
  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-[var(--border-default)] bg-[var(--bg-base)] px-4">
      <div className="w-16" aria-hidden />
      <div className="absolute left-1/2 -translate-x-1/2">
        <img
          src="/logo.png"
          alt="Dahlia Medical Group"
          className="h-9 w-auto object-contain"
        />
      </div>
      <div className="ml-auto w-16 text-right">
        {showLogout ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="text-sm font-medium text-[var(--text-muted)] disabled:opacity-50"
          >
            Logout
          </button>
        ) : null}
      </div>
    </header>
  )
}

function PinView() {
  const router = useRouter()
  const login = useServerFn(loginStaff)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    try {
      await login({ data: { pin } })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PIN')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-base)]">
      <ProductBar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <h1 className="mb-2 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">
          Staff sign-in
        </h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">Clinic staff only</p>
        <PinField
          value={pin}
          onChange={setPin}
          onSubmit={handleSubmit}
          error={error}
          submitting={submitting}
        />
      </main>
    </div>
  )
}

type BoardViewProps = {
  clinicName: string
  columns: Extract<ClinicPage, { screen: 'board' }>['columns']
}

function BoardView({ clinicName, columns }: BoardViewProps) {
  const router = useRouter()
  const logout = useServerFn(logoutStaff)
  const applyAction = useServerFn(applyOrderAction)
  const [loggingOut, setLoggingOut] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      await router.invalidate()
    } finally {
      setLoggingOut(false)
    }
  }

  async function handleAction(orderId: string, action: Parameters<typeof applyAction>[0]['data']['action']) {
    setPendingOrderId(orderId)
    setErrors((current) => {
      const next = { ...current }
      delete next[orderId]
      return next
    })

    try {
      await applyAction({ data: { orderId, action } })
      await router.invalidate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setErrors((current) => ({ ...current, [orderId]: message }))
    } finally {
      setPendingOrderId(null)
    }
  }

  function handlePrimaryAction(ticket: ClinicTicket) {
    return handleAction(ticket.id, primaryActionForStatus(ticket.status))
  }

  function handleReject(ticket: ClinicTicket, reason: string) {
    return handleAction(ticket.id, { type: 'reject', reason })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-base)]">
      <ProductBar
        showLogout
        loggingOut={loggingOut}
        onLogout={() => void handleLogout()}
      />
      <LimeBanner label={clinicName} />

      <main className="flex flex-1 flex-col overflow-hidden px-4 py-5 md:px-6">
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2 md:gap-4">
          <KanbanColumn
            title="New Requests"
            tickets={columns.new}
            className="min-w-[min(100%,16rem)] flex-[1.2] bg-[var(--bg-lime)]/15"
            headerClassName="bg-[var(--bg-lime)]/40"
            emphasizeOrderId={false}
            pendingOrderId={pendingOrderId}
            errors={errors}
            onPrimaryAction={handlePrimaryAction}
            onReject={handleReject}
          />
          <KanbanColumn
            title="Preparing"
            tickets={columns.preparing}
            className="min-w-[min(100%,14rem)] flex-1 bg-[var(--bg-slate)]/10"
            headerClassName="bg-[var(--bg-slate)]/25"
            emphasizeOrderId={false}
            pendingOrderId={pendingOrderId}
            errors={errors}
            onPrimaryAction={handlePrimaryAction}
            onReject={handleReject}
          />
          <KanbanColumn
            title="Ready for Pickup"
            tickets={columns.ready}
            className="min-w-[min(100%,12rem)] flex-[0.85] bg-[var(--bg-muted)]/30"
            headerClassName="bg-[var(--bg-muted)]"
            emphasizeOrderId
            pendingOrderId={pendingOrderId}
            errors={errors}
            onPrimaryAction={handlePrimaryAction}
            onReject={handleReject}
          />
        </div>
      </main>
    </div>
  )
}

type KanbanColumnProps = {
  title: string
  tickets: ClinicTicket[]
  className?: string
  headerClassName?: string
  emphasizeOrderId: boolean
  pendingOrderId: string | null
  errors: Record<string, string>
  onPrimaryAction: (ticket: ClinicTicket) => void | Promise<void>
  onReject: (ticket: ClinicTicket, reason: string) => void | Promise<void>
}

function KanbanColumn({
  title,
  tickets,
  className,
  headerClassName,
  emphasizeOrderId,
  pendingOrderId,
  errors,
  onPrimaryAction,
  onReject,
}: KanbanColumnProps) {
  return (
    <section
      className={cn(
        'flex min-h-[20rem] flex-col rounded-[20px] border border-[var(--border-default)]',
        className,
      )}
    >
      <header
        className={cn(
          'shrink-0 rounded-t-[20px] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]',
          headerClassName,
        )}
      >
        {title}
        <span className="ml-2 font-normal text-[var(--text-muted)]">
          ({tickets.length})
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {tickets.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            No tickets
          </p>
        ) : (
          tickets.map((ticket) => (
            <TicketSlip
              key={ticket.id}
              ticket={ticket}
              emphasizeOrderId={emphasizeOrderId}
              pending={pendingOrderId === ticket.id}
              error={errors[ticket.id]}
              onPrimaryAction={() => onPrimaryAction(ticket)}
              onReject={(reason) => onReject(ticket, reason)}
            />
          ))
        )}
      </div>
    </section>
  )
}
