import { useState, type ReactNode } from 'react'

import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronRight } from 'lucide-react'

import { LimeBanner } from '#/components/refill/LimeBanner.tsx'
import { MedicineRow } from '#/components/refill/MedicineRow.tsx'
import { PillButton } from '#/components/refill/PillButton.tsx'
import { PreferredSlotPicker } from '#/components/refill/PreferredSlotPicker.tsx'
import { ResultCard } from '#/components/refill/ResultCard.tsx'
import {
  StatusPill,
  statusVariantFromOrderStatus,
} from '#/components/refill/StatusPill.tsx'
import { WhatsAppPreview } from '#/components/refill/WhatsAppPreview.tsx'
import {
  getRefillPage,
  submitRefill,
  type RefillPage,
  type RefillRepeat,
} from '#/lib/refill/patient.functions.ts'
import {
  continueAsPatient,
  logoutPatient,
} from '#/lib/refill/session.functions.ts'
import { useProductPoll } from '#/lib/refill/useProductPoll.ts'

export const Route = createFileRoute('/refill')({
  head: () => ({
    meta: [
      {
        title: 'Refill · Dahlia Medical Group',
      },
    ],
  }),
  loader: () => getRefillPage(),
  component: Refill,
})

function Refill() {
  const data = Route.useLoaderData()
  useProductPoll(data.screen === 'status')

  if (data.screen === 'picker') {
    return <PickerView patients={data.patients} />
  }

  if (data.screen === 'form') {
    return (
      <SignedInShell clinicName={data.clinic.name}>
        <RequestFormView
          repeats={data.repeats}
          patientName={data.patient.name}
        />
      </SignedInShell>
    )
  }

  return (
    <SignedInShell clinicName={data.clinic.name}>
      <StatusView
        clinicName={data.clinic.name}
        patientName={data.patient.name}
        order={data.order}
        repeats={data.repeats}
      />
    </SignedInShell>
  )
}

type SignedInShellProps = {
  clinicName: string
  children: ReactNode
}

function SignedInShell({ clinicName, children }: SignedInShellProps) {
  const router = useRouter()
  const logout = useServerFn(logoutPatient)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      await router.invalidate()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ProductBar
        onLogout={handleLogout}
        loggingOut={loggingOut}
        showLogout
      />
      <LimeBanner label={clinicName} />
      <div className="flex flex-1 flex-col px-4 py-5">{children}</div>
    </div>
  )
}

type ProductBarProps = {
  showLogout?: boolean
  loggingOut?: boolean
  onLogout?: () => void
}

function ProductBar({ showLogout, loggingOut, onLogout }: ProductBarProps) {
  return (
    <header className="relative flex h-14 items-center border-b border-[var(--border-default)] bg-[var(--bg-base)] px-4">
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

type PickerViewProps = {
  patients: Extract<RefillPage, { screen: 'picker' }>['patients']
}

function PickerView({ patients }: PickerViewProps) {
  const router = useRouter()
  const continueAs = useServerFn(continueAsPatient)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleContinue(patientId: string) {
    setPendingId(patientId)
    try {
      await continueAs({ data: { patientId } })
      await router.invalidate()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ProductBar />
      <main className="flex flex-1 flex-col px-4 py-6">
        <h1 className="mb-8 text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight">
          Who&apos;s filling a refill?
        </h1>
        <ul className="flex flex-col gap-3">
          {patients.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                disabled={pendingId !== null}
                onClick={() => handleContinue(patient.id)}
                className="group flex w-full items-center justify-between gap-4 rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 text-left transition-colors hover:border-[var(--text-primary)] disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-lg font-medium text-[var(--text-primary)]">
                    {patient.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                    {patient.phone}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

type RequestFormViewProps = {
  repeats: RefillRepeat[]
  patientName: string
  onSuccess?: () => void | Promise<void>
}

function RequestFormView({
  repeats,
  patientName,
  onSuccess,
}: RequestFormViewProps) {
  const router = useRouter()
  const submit = useServerFn(submitRefill)
  const [selected, setSelected] = useState<string[]>([])
  const [preferredAt, setPreferredAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleMedicine(medicineId: string) {
    setSelected((current) =>
      current.includes(medicineId)
        ? current.filter((id) => id !== medicineId)
        : [...current, medicineId],
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (selected.length === 0 || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await submit({
        data: {
          medicineIds: selected,
          preferredAt,
        },
      })
      if (onSuccess) {
        await onSuccess()
      } else {
        await router.invalidate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="-mx-4 flex flex-1 flex-col bg-[var(--bg-grey)] px-4 py-5"
    >
      <h1 className="mb-1 text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight">
        Request a refill
      </h1>
      {patientName ? (
        <p className="mb-6 text-sm text-[var(--text-muted)]">For {patientName}</p>
      ) : (
        <div className="mb-6" />
      )}

      <ResultCard className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Selected
        </p>
        <p
          className="mt-1 font-extrabold leading-none tracking-tight text-[var(--text-primary)]"
          style={{ fontSize: 'clamp(3rem, 18vw, 5rem)' }}
        >
          {selected.length}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {selected.length === 1 ? 'medicine' : 'medicines'}
        </p>
      </ResultCard>

      <div className="mb-6 flex flex-col gap-2">
        {repeats.map((repeat) => (
          <MedicineRow
            key={repeat.medicineId}
            name={repeat.name}
            strength={repeat.strength}
            selected={selected.includes(repeat.medicineId)}
            onToggle={() => toggleMedicine(repeat.medicineId)}
          />
        ))}
      </div>

      <ResultCard className="mb-6">
        <div className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Preferred collection
          </span>
          <PreferredSlotPicker value={preferredAt} onChange={setPreferredAt} />
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Preference only — not a booked slot.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-[var(--state-error)]">{error}</p>
        ) : null}
      </ResultCard>

      <div className="sticky bottom-0 mt-auto bg-[var(--bg-grey)] pb-2 pt-3">
        <PillButton
          type="submit"
          disabled={selected.length === 0 || submitting || preferredAt.length === 0}
        >
          {submitting ? 'Submitting…' : 'Submit request'}
        </PillButton>
      </div>
    </form>
  )
}

type StatusViewProps = {
  clinicName: string
  patientName: string
  order: Extract<RefillPage, { screen: 'status' }>['order']
  repeats: RefillRepeat[]
}

function StatusView({ clinicName, patientName, order, repeats }: StatusViewProps) {
  const router = useRouter()
  const [requestAgain, setRequestAgain] = useState(false)

  if (order.status === 'REJECTED' && requestAgain) {
    return (
      <RequestFormView
        repeats={repeats}
        patientName={patientName}
        onSuccess={() => router.invalidate()}
      />
    )
  }

  const isReady = order.status === 'READY'
  const variant = statusVariantFromOrderStatus(
    order.status as 'NEW' | 'PREPARING' | 'READY' | 'REJECTED',
  )

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="relative mb-6">
        <StatusPill variant={variant} className="relative z-20 mb-4" />

        <div className="relative">
          <p
            className={`font-extrabold leading-[0.9] tracking-tight ${
              isReady ? 'text-[var(--accent-lime)]' : 'text-[var(--text-primary)]'
            }`}
            style={{ fontSize: 'clamp(64px, 22vw, 140px)' }}
          >
            #{order.displayId}
          </p>

          {isReady ? (
            <WhatsAppPreview
              displayId={order.displayId}
              clinicName={clinicName}
              readyAt={order.readyAt}
              className="relative mt-4 max-w-full rotate-0 sm:absolute sm:-right-1 sm:top-[38%] sm:mt-0 sm:-translate-y-1/2 sm:max-w-[min(100%,280px)] sm:rotate-[-2deg]"
            />
          ) : null}
        </div>
      </div>

      <div className="space-y-4 text-sm text-[var(--text-muted)]">
        <div>
          <p className="text-xs uppercase tracking-wide">Preferred collection</p>
          <p className="mt-1 text-base text-[var(--text-primary)]">
            {new Date(order.preferredAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide">Medicines</p>
          <ul className="mt-2 space-y-1">
            {order.items.map((item) => (
              <li
                key={`${item.name}-${item.strength}`}
                className="text-base text-[var(--text-primary)]"
              >
                {item.name} {item.strength}
              </li>
            ))}
          </ul>
        </div>

        {order.status === 'REJECTED' && order.rejectReason ? (
          <div className="rounded-[20px] border border-[var(--state-error)]/20 bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--state-error)]">
              {order.rejectReason}
            </p>
            <PillButton
              type="button"
              className="mt-4"
              onClick={() => setRequestAgain(true)}
            >
              Request again
            </PillButton>
          </div>
        ) : null}
      </div>
    </main>
  )
}
