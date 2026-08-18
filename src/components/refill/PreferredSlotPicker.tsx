import { useMemo, useState, type ReactNode } from 'react'

import { CalendarClock, ChevronRight } from 'lucide-react'
import Picker from 'react-mobile-picker'
import { Drawer } from 'vaul'

import { cn } from '#/lib/utils.ts'

import { PillButton } from './PillButton.tsx'

type PickerSlot = {
  date: string
  hour: string
  minute: string
}

type PreferredSlotPickerProps = {
  value: string
  onChange: (iso: string) => void
}

const HOURS = Array.from({ length: 11 }, (_, index) =>
  String(index + 8).padStart(2, '0'),
)
const MINUTES = ['00', '30'] as const

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultSlot(): PickerSlot {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(10, 0, 0, 0)
  return {
    date: formatDateKey(date),
    hour: '10',
    minute: '00',
  }
}

function snapMinute(minute: number): (typeof MINUTES)[number] {
  return minute < 15 ? '00' : minute < 45 ? '30' : '00'
}

function parseIsoToPicker(iso: string): PickerSlot {
  const date = new Date(iso)
  const hour = date.getHours()
  const clampedHour = Math.min(18, Math.max(8, hour))

  return {
    date: formatDateKey(date),
    hour: String(clampedHour).padStart(2, '0'),
    minute: snapMinute(date.getMinutes()),
  }
}

function pickerToIso(slot: PickerSlot): string {
  return new Date(`${slot.date}T${slot.hour}:${slot.minute}:00`).toISOString()
}

function formatDisplay(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatHourLabel(hour: string): string {
  const value = Number.parseInt(hour, 10)
  const period = value >= 12 ? 'PM' : 'AM'
  const hour12 = value % 12 === 0 ? 12 : value % 12
  return `${hour12} ${period}`
}

function buildDateOptions() {
  const options: Array<{ value: string; label: string }> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    const value = formatDateKey(date)

    let label: string
    if (offset === 0) {
      label = 'Today'
    } else if (offset === 1) {
      label = 'Tomorrow'
    } else {
      label = date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    }

    options.push({ value, label })
  }

  return options
}

function WheelItem({
  children,
  selected,
}: {
  children: ReactNode
  selected: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center justify-center text-base transition-all duration-150',
        selected
          ? 'scale-100 font-semibold text-[var(--text-primary)]'
          : 'scale-95 text-[var(--text-muted)]',
      )}
    >
      {children}
    </div>
  )
}

export function PreferredSlotPicker({
  value,
  onChange,
}: PreferredSlotPickerProps) {
  const dateOptions = useMemo(() => buildDateOptions(), [])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PickerSlot>(defaultSlot)

  function openDrawer() {
    setDraft(value ? parseIsoToPicker(value) : defaultSlot())
    setOpen(true)
  }

  function handleDone() {
    onChange(pickerToIso(draft))
    setOpen(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={openDrawer}
        className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <CalendarClock
            className="h-5 w-5 shrink-0 text-[var(--text-muted)]"
            strokeWidth={1.75}
          />
          <span
            className={cn(
              'truncate text-base',
              value
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)]',
            )}
          >
            {value ? formatDisplay(value) : 'Choose date and time'}
          </span>
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-[var(--text-muted)]"
          strokeWidth={1.75}
        />
      </button>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-[430px] flex-col rounded-t-[24px] bg-[var(--bg-surface)] outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--border-default)]" />
          <div className="border-b border-[var(--border-default)] px-5 py-4">
            <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">
              Preferred collection
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-[var(--text-muted)]">
              Preference only — not a booked slot.
            </Drawer.Description>
          </div>

          <div className="relative px-2 py-2">
            <div
              className="pointer-events-none absolute inset-x-4 top-1/2 z-0 h-11 -translate-y-1/2 rounded-[12px] bg-[var(--bg-lime)]/35"
              aria-hidden
            />
            <Picker
              value={draft}
              onChange={setDraft}
              wheelMode="natural"
              height={220}
              itemHeight={44}
            >
              <Picker.Column name="date">
                {dateOptions.map((option) => (
                  <Picker.Item key={option.value} value={option.value}>
                    {({ selected }) => (
                      <WheelItem selected={selected}>{option.label}</WheelItem>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="hour">
                {HOURS.map((hour) => (
                  <Picker.Item key={hour} value={hour}>
                    {({ selected }) => (
                      <WheelItem selected={selected}>
                        {formatHourLabel(hour)}
                      </WheelItem>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="minute">
                {MINUTES.map((minute) => (
                  <Picker.Item key={minute} value={minute}>
                    {({ selected }) => (
                      <WheelItem selected={selected}>:{minute}</WheelItem>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          </div>

          <div className="border-t border-[var(--border-default)] px-4 py-4">
            <PillButton type="button" onClick={handleDone}>
              Done
            </PillButton>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
