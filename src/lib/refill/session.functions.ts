import { createServerFn } from '@tanstack/react-start'

import { prisma } from '#/db.ts'

import {
  clearPatientCookie,
  clearStaffCookie,
  getPatientCookie,
  getStaffCookie,
  setPatientCookie,
  setStaffCookie,
  STAFF_COOKIE_VALUE,
} from './cookies.ts'
import { assertStaffPin } from './session.ts'

function parsePatientId(data: unknown): { patientId: string } {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('patientId' in data) ||
    typeof data.patientId !== 'string' ||
    data.patientId.length === 0
  ) {
    throw new Error('Unknown patient')
  }

  return { patientId: data.patientId }
}

function parsePin(data: unknown): { pin: string } {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('pin' in data) ||
    typeof data.pin !== 'string'
  ) {
    throw new Error('Invalid PIN')
  }

  return { pin: data.pin }
}

export const continueAsPatient = createServerFn({ method: 'POST' })
  .validator(parsePatientId)
  .handler(async ({ data }) => {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { id: true, name: true },
    })

    if (!patient) {
      throw new Error('Unknown patient')
    }

    setPatientCookie(patient.id)
    return { id: patient.id, name: patient.name }
  })

export const logoutPatient = createServerFn({ method: 'POST' }).handler(
  async () => {
    clearPatientCookie()
    return { ok: true as const }
  },
)

export const getPatientSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const id = getPatientCookie()
    if (!id) {
      return { patient: null }
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!patient) {
      return { patient: null }
    }

    return { patient }
  },
)

export const loginStaff = createServerFn({ method: 'POST' })
  .validator(parsePin)
  .handler(async ({ data }) => {
    assertStaffPin(data.pin)
    setStaffCookie()
    return { ok: true as const }
  })

export const logoutStaff = createServerFn({ method: 'POST' }).handler(
  async () => {
    clearStaffCookie()
    return { ok: true as const }
  },
)

export const getStaffSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { ok: getStaffCookie() === STAFF_COOKIE_VALUE }
  },
)
