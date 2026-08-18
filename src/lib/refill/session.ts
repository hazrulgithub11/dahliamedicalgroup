import { prisma } from '#/db.ts'

import {
  getPatientCookie,
  getStaffCookie,
  STAFF_COOKIE_VALUE,
} from './cookies.ts'

export async function requirePatient(): Promise<{ id: string; name: string }> {
  const id = getPatientCookie()
  if (!id) {
    throw new Error('Not signed in')
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!patient) {
    throw new Error('Not signed in')
  }

  return patient
}

export function requireStaff(): void {
  if (getStaffCookie() !== STAFF_COOKIE_VALUE) {
    throw new Error('Staff sign-in required')
  }
}

export function assertStaffPin(pin: string): void {
  const expected = process.env.STAFF_PIN
  if (!expected) {
    throw new Error('STAFF_PIN is not configured')
  }
  if (!pin || pin !== expected) {
    throw new Error('Invalid PIN')
  }
}
