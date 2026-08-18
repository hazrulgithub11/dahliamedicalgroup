# 02 — Session helpers + status machine

Stand up `src/lib/refill/` with demo session cookies and the order status graph. This is the second implementation unit. No `/refill` UI, no `/clinic` UI, no order create/transition handlers, and no marketing-chrome changes.

Source of truth for names and invariants: `context/architecture.md`. This spec only decides cookie flags, env, file layout, function contracts, and the transition table so implementation does not invent auth or status rules.

## Why this unit now

Patient and clinic routes both need a server-side identity and a single place that rejects illegal status moves. Unit 01 left those as application-level rules. If routes ship first, each screen will invent its own cookie and transition checks. This pass creates the shared boundary they will call.

## Scope

### In

- `src/lib/refill/` — cookie helpers, patient/staff session helpers, login/logout `createServerFn`s, pure status machine.
- `STAFF_PIN` in `.env.local` (env only, never a database row, never `VITE_`).
- Cookie names exactly `dahlia_patient` and `dahlia_staff`.

### Out

- `/refill` and `/clinic` route files and any product UI (`src/components/refill/`).
- Hiding marketing Header/Footer in `__root.tsx` — next unit.
- Order submit, Kanban actions, polling, WhatsApp preview copy.
- `listDemoPatients` (picker data) — patient route unit.
- Prisma schema/seed changes. Seeded ids stay `patient_siti`, `patient_ahmad`, `patient_mei`.
- Session table, signed tokens, `__Host-` prefix, Clerk, OTP, OAuth, CSRF middleware, rate limiting.
- Zod. Use a function `.validator()` (no new dependency).
- Marketing pages at `/`.

## Cookies

Use `getCookie`, `setCookie`, and `deleteCookie` from `@tanstack/react-start/server`. Read and write cookies only inside `.handler()` or middleware `.server()`, never at module scope.

| Cookie | Value | Meaning |
| --- | --- | --- |
| `dahlia_patient` | Patient `id` string (e.g. `patient_siti`) | Demo patient principal |
| `dahlia_staff` | `"1"` | Staff is signed in. Never store the PIN |

Shared `setCookie` / `deleteCookie` options:

| Option | Value | Why |
| --- | --- | --- |
| `httpOnly` | `true` | Not readable from JS |
| `path` | `'/'` | Available to later `/refill` and `/clinic` |
| `sameSite` | `'lax'` | Demo is same-site; blocks most CSRF |
| `secure` | `process.env.NODE_ENV === 'production'` | Local `vite dev` is HTTP; `Secure` would drop the cookie |
| `maxAge` | `60 * 60 * 24` | One day — long enough for a client walkthrough |

Do not use the `__Host-` prefix. Architecture already named these cookies, and `__Host-` requires `Secure` (breaks localhost HTTP).

Logout clears **only** the cookie for that role. Patient logout must not delete `dahlia_staff`, and staff logout must not delete `dahlia_patient` (two browsers / two roles in one demo session).

Patient functions never treat a staff cookie as identity. Staff functions never treat a patient cookie as identity.

## `STAFF_PIN`

Add to `.env.local` (already gitignored via `*.local`):

```
STAFF_PIN=1234
```

Rules:

- Name is `STAFF_PIN`. Never `VITE_STAFF_PIN` (that would ship to the client).
- Read inside the login handler: `process.env.STAFF_PIN`. Do not cache at module load.
- If unset or empty, throw a server error. Do not compare against `''` (that would accept an empty PIN).
- Compare the submitted PIN to the env value as strings. Do not log either value. Do not return the expected PIN in any error body.
- Wrong PIN and a missing PIN field use the same client-visible message: `Invalid PIN`.

## Status machine

Pure module. No Prisma, no cookies, no `createServerFn`. Later clinic handlers will call this, then `prisma.order.update`.

Allowed graph (from `architecture.md`). Status never moves backward. Terminal states have no exits.

```
NEW        → PREPARING | REJECTED
PREPARING  → READY | REJECTED
READY      → COMPLETED
COMPLETED  → (none)
REJECTED   → (none)
```

Illegal examples that must throw: `NEW → READY`, `NEW → COMPLETED`, `PREPARING → COMPLETED`, `READY → PREPARING`, `READY → REJECTED`, anything from `COMPLETED` or `REJECTED`.

### Action → next status

Staff actions, not free-form status strings from the client:

| Action | From | To | Extra patch |
| --- | --- | --- | --- |
| `accept` | `NEW` | `PREPARING` | none |
| `ready` | `PREPARING` | `READY` | `readyAt: now` |
| `complete` | `READY` | `COMPLETED` | none |
| `reject` | `NEW` or `PREPARING` | `REJECTED` | `rejectReason` required |

`reject` reason: trim, then require length ≥ 1. Empty / whitespace-only throws `Reject reason is required`. Do not set `rejectReason` on non-reject actions. Never include `displayId` in the patch. Never clear `readyAt` on any transition (Ready is the only writer).

Export a single apply function that returns the Prisma-shaped patch (or throws). Suggested signature:

```ts
export type StaffAction =
  | { type: 'accept' }
  | { type: 'ready' }
  | { type: 'complete' }
  | { type: 'reject'; reason: string }

export type StatusPatch = {
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED'
  readyAt?: Date
  rejectReason?: string
}

export function applyStaffAction(
  current: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED',
  action: StaffAction,
  now?: Date,
): StatusPatch
```

Illegal move message: `Illegal status transition: ${current} → ${next}`.

`now` is injectable so the function stays deterministic in a one-off check; default `new Date()` when omitted.

## Server functions

These exist so later routes can issue and read sessions without touching cookies in the browser. They are the only Prisma users in this unit (`src/db.ts` imported only from `.functions.ts`). Route files still must not import Prisma.

All mutations are `POST`. Session reads are `GET`. Validate input with a function `.validator()` (no Zod).

### Patient

**`continueAsPatient`** `POST`

- Input: `{ patientId: string }`
- Lookup `prisma.patient.findUnique({ where: { id } })`. If missing, throw `Unknown patient` and do **not** set a cookie.
- On hit: set `dahlia_patient` to that `id`. Return `{ id, name }` (no phone).
- Do not trust a client-supplied name. Identity is the id after a DB hit.

**`logoutPatient`** `POST`

- Clear `dahlia_patient` only. Return `{ ok: true }` even if no cookie was present.

**`getPatientSession`** `GET`

- No cookie → `{ patient: null }`
- Cookie present but patient row gone → treat as signed out: `{ patient: null }` (do not leak a dangling id)
- Cookie + row → `{ patient: { id, name } }`

### Staff

**`loginStaff`** `POST`

- Input: `{ pin: string }`
- If pin matches `STAFF_PIN`, set `dahlia_staff` to `"1"`, return `{ ok: true }`
- Otherwise throw `Invalid PIN`. Do not set the cookie.

**`logoutStaff`** `POST`

- Clear `dahlia_staff` only. Return `{ ok: true }` even if no cookie was present.

**`getStaffSession`** `GET`

- Cookie value is exactly `"1"` → `{ ok: true }`
- Missing or any other value → `{ ok: false }`

### Helpers used inside later handlers (export now)

Not `createServerFn`s — plain server functions for unit 04/05 to call:

- `requirePatient(): Promise<{ id: string; name: string }>` — cookie + live row, else throw `Not signed in`
- `requireStaff(): void` — cookie is `"1"`, else throw `Staff sign-in required`

`requirePatient` scopes later reads to that id. It must not accept a `patientId` argument from the client as a substitute for the cookie.

## Files

| File | Change |
| --- | --- |
| `src/lib/refill/cookies.ts` | Cookie names, flags, get/set/clear for both roles |
| `src/lib/refill/session.ts` | `requirePatient`, `requireStaff`, PIN read/compare |
| `src/lib/refill/session.functions.ts` | The six `createServerFn`s above |
| `src/lib/refill/status.ts` | `StaffAction`, `applyStaffAction`, allowed graph |
| `.env.local` | Add `STAFF_PIN=1234` next to `DATABASE_URL` |

Do not add `src/lib/refill/index.ts` that re-exports cookie setters — route components must import `session.functions.ts` only. `status.ts` has no server imports and may be imported from later clinic handlers.

`src/db.ts` stays the Prisma singleton. `cookies.ts` / `session.ts` must not be imported from route components or other client modules.

Do not create `/refill` or `/clinic` files in this unit. Do not change `__root.tsx`, Header, or the homepage.

## Error messages (lock these)

| Situation | Message |
| --- | --- |
| Continue-as id not in `Patient` | `Unknown patient` |
| `requirePatient` with no valid session | `Not signed in` |
| PIN mismatch or empty pin | `Invalid PIN` |
| `STAFF_PIN` missing on the server | `STAFF_PIN is not configured` |
| `requireStaff` with no valid session | `Staff sign-in required` |
| Illegal graph move | `Illegal status transition: {from} → {to}` |
| Reject with blank reason | `Reject reason is required` |

Throw `Error` with that `message`. Do not invent a Result union.

## Verification

1. `npm run build` passes. No new route files. Marketing `/` still renders with Header.
2. `.env.local` contains `STAFF_PIN=1234`. Grep confirms no `VITE_STAFF_PIN` and no PIN string in `src/` besides `process.env.STAFF_PIN`.
3. Cookie helpers use `httpOnly: true`, `path: '/'`, `sameSite: 'lax'`, production-only `secure`, `maxAge` 86400. Names are exactly `dahlia_patient` and `dahlia_staff`.
4. `continueAsPatient` looks up Prisma by id before `setCookie`. `requirePatient` ignores a staff cookie.
5. Status table: from a `tsx` one-off or a commented assertion block in `status.ts`, confirm:
   - `NEW` + `accept` → `{ status: 'PREPARING' }`
   - `PREPARING` + `ready` → `{ status: 'READY', readyAt }`
   - `READY` + `complete` → `{ status: 'COMPLETED' }`
   - `NEW` + `reject` `{ reason: '  Out of stock  ' }` → `{ status: 'REJECTED', rejectReason: 'Out of stock' }`
   - `NEW` + `ready`, `READY` + `accept`, `COMPLETED` + `reject`, `READY` + `reject` all throw the illegal-transition message
   - `NEW` + `reject` `{ reason: '   ' }` throws `Reject reason is required`
6. Optional smoke (dev server, two requests): `continueAsPatient` with `patient_siti` sets the patient cookie; `continueAsPatient` with `patient_nope` does not; `loginStaff` with `1234` sets staff cookie; `loginStaff` with `0000` does not. Skip if no HTTP harness — the contracts above are enough for this unit.

## Done when

- `src/lib/refill/` exists with cookies, session helpers, the six server functions, and `applyStaffAction`.
- PIN is env-only. Cookies are HttpOnly. Roles cannot impersonate each other.
- Status graph matches `architecture.md`. No order rows are created or updated in this unit.
- No product routes or chrome changes shipped.

Next unit: hide marketing Header/Footer on `/refill` and `/clinic` (product chrome comes with those routes). Patient picker → form → status follows after chrome.
