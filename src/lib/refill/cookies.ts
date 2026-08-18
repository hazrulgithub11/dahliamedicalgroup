import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

export const PATIENT_COOKIE = 'dahlia_patient'
export const STAFF_COOKIE = 'dahlia_staff'
export const STAFF_COOKIE_VALUE = '1'

const MAX_AGE = 60 * 60 * 24

function cookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  }
}

export function getPatientCookie(): string | undefined {
  return getCookie(PATIENT_COOKIE)
}

export function setPatientCookie(patientId: string): void {
  setCookie(PATIENT_COOKIE, patientId, cookieOptions())
}

export function clearPatientCookie(): void {
  deleteCookie(PATIENT_COOKIE, cookieOptions())
}

export function getStaffCookie(): string | undefined {
  return getCookie(STAFF_COOKIE)
}

export function setStaffCookie(): void {
  setCookie(STAFF_COOKIE, STAFF_COOKIE_VALUE, cookieOptions())
}

export function clearStaffCookie(): void {
  deleteCookie(STAFF_COOKIE, cookieOptions())
}
