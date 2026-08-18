import { createServerFn } from '@tanstack/react-start'

import { prisma } from '#/db.ts'

import { getPatientCookie } from './cookies.ts'
import { requirePatient } from './session.ts'

const CLINIC_ID = 'clinic_selayang'

const OPEN_STATUSES = ['NEW', 'PREPARING', 'READY'] as const

export type RefillRepeat = {
  medicineId: string
  name: string
  strength: string
}

export type RefillOrder = {
  displayId: number
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED'
  preferredAt: string
  rejectReason: string | null
  readyAt: string | null
  items: Array<{ name: string; strength: string }>
}

export type RefillPage =
  | {
      screen: 'picker'
      patients: Array<{ id: string; name: string; phone: string }>
    }
  | {
      screen: 'form'
      patient: { id: string; name: string }
      clinic: { id: string; name: string }
      repeats: RefillRepeat[]
    }
  | {
      screen: 'status'
      patient: { id: string; name: string }
      clinic: { id: string; name: string }
      repeats: RefillRepeat[]
      order: RefillOrder
    }

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

function parseSubmit(data: unknown): {
  medicineIds: string[]
  preferredAt: string
} {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Select at least one medicine')
  }

  if (!('medicineIds' in data) || !Array.isArray(data.medicineIds)) {
    throw new Error('Select at least one medicine')
  }

  const medicineIds = data.medicineIds.filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  )

  if (medicineIds.length === 0) {
    throw new Error('Select at least one medicine')
  }

  if (
    !('preferredAt' in data) ||
    typeof data.preferredAt !== 'string' ||
    data.preferredAt.length === 0
  ) {
    throw new Error('Preferred collection time is required')
  }

  const preferredAt = new Date(data.preferredAt)
  if (Number.isNaN(preferredAt.getTime())) {
    throw new Error('Preferred collection time is required')
  }

  return { medicineIds, preferredAt: data.preferredAt }
}

function serializeOrder(order: {
  displayId: number
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED'
  preferredAt: Date
  rejectReason: string | null
  readyAt: Date | null
  items: Array<{ name: string; strength: string }>
}): RefillOrder {
  return {
    displayId: order.displayId,
    status: order.status,
    preferredAt: order.preferredAt.toISOString(),
    rejectReason: order.rejectReason,
    readyAt: order.readyAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      name: item.name,
      strength: item.strength,
    })),
  }
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

async function loadRepeats(patientId: string): Promise<RefillRepeat[]> {
  const rows = await prisma.patientRepeat.findMany({
    where: { patientId },
    include: {
      medicine: { select: { id: true, name: true, strength: true } },
    },
    orderBy: [{ medicine: { name: 'asc' } }, { medicine: { strength: 'asc' } }],
  })

  return rows.map((row) => ({
    medicineId: row.medicine.id,
    name: row.medicine.name,
    strength: row.medicine.strength,
  }))
}

async function resolvePatientSession(): Promise<{
  id: string
  name: string
} | null> {
  const id = getPatientCookie()
  if (!id) {
    return null
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!patient) {
    return null
  }

  return patient
}

async function findOpenOrder(patientId: string) {
  return prisma.order.findFirst({
    where: {
      patientId,
      status: { in: [...OPEN_STATUSES] },
    },
    include: {
      items: { select: { name: true, strength: true } },
    },
  })
}

async function buildPageForPatient(patient: {
  id: string
  name: string
}): Promise<Exclude<RefillPage, { screen: 'picker' }>> {
  const [clinic, repeats] = await Promise.all([
    loadClinic(),
    loadRepeats(patient.id),
  ])

  const openOrder = await findOpenOrder(patient.id)

  if (openOrder) {
    return {
      screen: 'status',
      patient,
      clinic,
      repeats,
      order: serializeOrder(openOrder),
    }
  }

  const latestOrder = await prisma.order.findFirst({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { select: { name: true, strength: true } },
    },
  })

  if (latestOrder?.status === 'REJECTED') {
    return {
      screen: 'status',
      patient,
      clinic,
      repeats,
      order: serializeOrder(latestOrder),
    }
  }

  return {
    screen: 'form',
    patient,
    clinic,
    repeats,
  }
}

async function fetchDemoPatients() {
  return prisma.patient.findMany({
    select: { id: true, name: true, phone: true },
    orderBy: { name: 'asc' },
  })
}

export const listDemoPatients = createServerFn({ method: 'GET' }).handler(
  async () => fetchDemoPatients(),
)

export const getRefillPage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<RefillPage> => {
    const patient = await resolvePatientSession()

    if (!patient) {
      const patients = await fetchDemoPatients()
      return { screen: 'picker', patients }
    }

    return buildPageForPatient(patient)
  },
)

export const submitRefill = createServerFn({ method: 'POST' })
  .validator(parseSubmit)
  .handler(async ({ data }) => {
    const patient = await requirePatient()
    const clinic = await loadClinic()

    const allowedRepeats = await prisma.patientRepeat.findMany({
      where: { patientId: patient.id },
      select: { medicineId: true },
    })

    const allowedIds = new Set(allowedRepeats.map((row) => row.medicineId))
    const uniqueIds = [...new Set(data.medicineIds)]

    for (const medicineId of uniqueIds) {
      if (!allowedIds.has(medicineId)) {
        throw new Error('Medicine is not on your repeat list')
      }
    }

    const existingOpen = await findOpenOrder(patient.id)
    if (existingOpen) {
      throw new Error('You already have an open request')
    }

    const medicines = await prisma.medicine.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true, strength: true },
    })

    if (medicines.length !== uniqueIds.length) {
      throw new Error('Medicine is not on your repeat list')
    }

    const medicineById = new Map(medicines.map((med) => [med.id, med]))
    const preferredAt = new Date(data.preferredAt)

    try {
      const order = await prisma.order.create({
        data: {
          patientId: patient.id,
          clinicId: clinic.id,
          status: 'NEW',
          preferredAt,
          items: {
            create: uniqueIds.map((medicineId) => {
              const medicine = medicineById.get(medicineId)!
              return {
                medicineId,
                name: medicine.name,
                strength: medicine.strength,
              }
            }),
          },
        },
        include: {
          items: { select: { name: true, strength: true } },
        },
      })

      return serializeOrder(order)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error('You already have an open request')
      }
      throw error
    }
  })
