import { createServerFn } from '@tanstack/react-start'

import { prisma } from '#/db.ts'

import { getStaffCookie, STAFF_COOKIE_VALUE } from './cookies.ts'
import { requireStaff } from './session.ts'
import { applyStaffAction, type StaffAction } from './status.ts'

const CLINIC_ID = 'clinic_selayang'

const LIVE_STATUSES = ['NEW', 'PREPARING', 'READY'] as const

export type ClinicTicket = {
  id: string
  displayId: number
  patientName: string
  preferredAt: string
  items: Array<{ name: string; strength: string }>
  status: 'NEW' | 'PREPARING' | 'READY'
}

export type ClinicPage =
  | { screen: 'pin' }
  | {
      screen: 'board'
      clinic: { id: string; name: string }
      columns: {
        new: ClinicTicket[]
        preparing: ClinicTicket[]
        ready: ClinicTicket[]
      }
    }

function isStaffSignedIn(): boolean {
  return getStaffCookie() === STAFF_COOKIE_VALUE
}

async function loadClinic() {
  const clinic = await prisma.clinic.findUnique({
    where: { id: CLINIC_ID },
    select: { id: true, name: true },
  })

  if (!clinic) {
    throw new Error('Clinic is not configured')
  }

  return clinic
}

function serializeTicket(order: {
  id: string
  displayId: number
  status: 'NEW' | 'PREPARING' | 'READY'
  preferredAt: Date
  patient: { name: string }
  items: Array<{ name: string; strength: string }>
}): ClinicTicket {
  return {
    id: order.id,
    displayId: order.displayId,
    patientName: order.patient.name,
    preferredAt: order.preferredAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.name,
      strength: item.strength,
    })),
    status: order.status,
  }
}

function parseOrderAction(data: unknown): {
  orderId: string
  action: StaffAction
} {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Order not found')
  }

  if (
    !('orderId' in data) ||
    typeof data.orderId !== 'string' ||
    data.orderId.length === 0
  ) {
    throw new Error('Order not found')
  }

  if (
    !('action' in data) ||
    typeof data.action !== 'object' ||
    data.action === null ||
    !('type' in data.action) ||
    typeof data.action.type !== 'string'
  ) {
    throw new Error('Order not found')
  }

  const actionType = data.action.type

  if (
    actionType !== 'accept' &&
    actionType !== 'ready' &&
    actionType !== 'complete' &&
    actionType !== 'reject'
  ) {
    throw new Error('Order not found')
  }

  if (actionType === 'reject') {
    if (
      !('reason' in data.action) ||
      typeof data.action.reason !== 'string'
    ) {
      throw new Error('Reject reason is required')
    }

    return {
      orderId: data.orderId,
      action: { type: 'reject', reason: data.action.reason },
    }
  }

  return {
    orderId: data.orderId,
    action: { type: actionType },
  }
}

export const getClinicPage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ClinicPage> => {
    if (!isStaffSignedIn()) {
      return { screen: 'pin' }
    }

    const clinic = await loadClinic()

    const orders = await prisma.order.findMany({
      where: {
        clinicId: CLINIC_ID,
        status: { in: [...LIVE_STATUSES] },
      },
      include: {
        patient: { select: { name: true } },
        items: { select: { name: true, strength: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const columns = {
      new: [] as ClinicTicket[],
      preparing: [] as ClinicTicket[],
      ready: [] as ClinicTicket[],
    }

    for (const order of orders) {
      const ticket = serializeTicket(order)
      if (order.status === 'NEW') {
        columns.new.push(ticket)
      } else if (order.status === 'PREPARING') {
        columns.preparing.push(ticket)
      } else {
        columns.ready.push(ticket)
      }
    }

    return { screen: 'board', clinic, columns }
  },
)

export const applyOrderAction = createServerFn({ method: 'POST' })
  .validator(parseOrderAction)
  .handler(async ({ data }) => {
    requireStaff()

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, status: true, clinicId: true },
    })

    if (!order || order.clinicId !== CLINIC_ID) {
      throw new Error('Order not found')
    }

    const patch = applyStaffAction(order.status, data.action)

    await prisma.order.update({
      where: { id: data.orderId },
      data: patch,
    })

    return { ok: true as const }
  })
