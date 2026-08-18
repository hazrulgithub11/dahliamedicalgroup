export type OrderStatus =
  | 'NEW'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'

export type StaffAction =
  | { type: 'accept' }
  | { type: 'ready' }
  | { type: 'complete' }
  | { type: 'reject'; reason: string }

export type StatusPatch = {
  status: OrderStatus
  readyAt?: Date
  rejectReason?: string
}

const ACTION_TO_STATUS = {
  accept: 'PREPARING',
  ready: 'READY',
  complete: 'COMPLETED',
  reject: 'REJECTED',
} as const satisfies Record<StaffAction['type'], OrderStatus>

const ALLOWED: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  NEW: ['PREPARING', 'REJECTED'],
  PREPARING: ['READY', 'REJECTED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
}

export function applyStaffAction(
  current: OrderStatus,
  action: StaffAction,
  now: Date = new Date(),
): StatusPatch {
  const next = ACTION_TO_STATUS[action.type]

  if (!ALLOWED[current].includes(next)) {
    throw new Error(`Illegal status transition: ${current} → ${next}`)
  }

  if (action.type === 'reject') {
    const rejectReason = action.reason.trim()
    if (rejectReason.length === 0) {
      throw new Error('Reject reason is required')
    }
    return { status: 'REJECTED', rejectReason }
  }

  if (action.type === 'ready') {
    return { status: 'READY', readyAt: now }
  }

  return { status: next }
}
