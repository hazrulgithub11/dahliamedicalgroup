# Dahlia Refill

## Overview

Dahlia Refill is a web-only repeat-prescription pre-order product built for Dahlia Medical Group clinics. Chronic patients request a medication refill from their phone, clinic staff pack the order before the patient arrives, and the patient collects at a dedicated "Pre-Order Pick Up" counter using a large numeric Order ID — skipping the walk-in queue entirely. This repository ships the client demo MVP: it must feel complete in a four-step walkthrough, not pass production pharmacy-software standards. The existing Dahlia Medical Group marketing site stays at `/`; the product lives on separate routes (`/refill` for patients, `/clinic` for staff).

## Goals

1. A client can watch a demo patient submit a refill and see the ticket appear on the clinic board in the same browsing session.
2. Clinic staff can move a ticket through New → Preparing → Ready → Completed, and can Reject a request with a short reason.
3. When staff marks Ready, the patient sees a simulated WhatsApp-style "ready for pickup" message and a large Order ID on their screen.

## Core User Flow

1. Patient opens `/refill` on their phone and signs in with a demo account (one-tap "Continue as…", no real OTP).
2. They see their seeded repeat-medication list. They pick one or more items, choose a preferred collection date/time, and submit.
3. Clinic staff at `/clinic` (staff PIN gate) sees the new ticket appear in the **New Requests** column.
4. Staff reviews the ticket and clicks **Accept & Prepare** (moves to Preparing) or **Reject** (with a short reason visible to the patient).
5. After packing the physical bag, staff clicks **Mark as Ready**. The patient's status page updates and a simulated WhatsApp-preview message appears on screen.
6. Patient arrives, shows the Order ID, pays at the counter if required, collects the bag. Staff clicks **Completed** — the ticket is archived.

## Features

### Patient Interface (`/refill`, mobile-first)

- Demo login — no App Store install, no real OTP or email/password.
- Repeat-medication list only (seeded per patient). No free-text medicine entry.
- Preferred collection slot is a preference field, not a capacity-booking calendar.
- Live status page: Preparing / Ready / Completed / Rejected.
- Large numeric Order ID (e.g. `#1042`) for counter pickup.
- In-app WhatsApp-style notification panel when status becomes Ready.
- Reject reason displayed if the request is declined.

### Clinic Interface (`/clinic`, tablet/desktop)

- Staff PIN gate (no per-user accounts for the demo).
- Kanban board: **New Requests | Preparing | Ready for Pickup**. Completed orders are archived, not a fourth live column.
- Per-ticket actions: Accept & Prepare, Mark as Ready, Completed, Reject.
- Each ticket shows patient name, medicines requested, preferred slot, and Order ID.

### Backend (same TanStack Start app)

- Prisma + PostgreSQL. Order statuses: `NEW | PREPARING | READY | COMPLETED | REJECTED`.
- Board refreshes via polling or router invalidation — sufficient for a demo, no websockets required.
- Seeded data: 2–3 demo patients with repeat lists, one demo clinic (Selayang).

## Scope

### In Scope

- Marketing site at `/` — unchanged.
- `/refill` patient flow (login, submit, status page).
- `/clinic` staff board (Kanban, all ticket actions).
- Demo patient accounts and staff PIN.
- Seeded repeat-medication lists for demo patients.
- Simulated WhatsApp preview on Ready (on-screen only, no real message sent).
- Reject path with a short reason shown to the patient.

### Out of Scope

- Real phone OTP, email/password auth, WhatsApp Business API, or SMS providers (Twilio etc.).
- Free-text medicine entry, new/acute prescriptions, inventory management, billing, or payments.
- Multi-clinic routing, pharmacist role separation, prescription expiry checks against an EMR.
- Native mobile apps, QR codes at pickup, calendar capacity management, true realtime websockets.

## Success Criteria

1. A demo patient can submit a refill from their repeat list on a phone-sized screen.
2. That ticket appears in New Requests on `/clinic` within a few seconds, without a manual page refresh.
3. Staff can move it to Preparing, then Ready; the patient then sees the Ready status, the Order ID, and a WhatsApp-style preview message.
4. Staff can Complete or Reject a ticket; the patient's status page reflects the change.
5. The Dahlia Medical Group marketing homepage continues to work exactly as it does today.
