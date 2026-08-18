# 01 — Data layer

Replace the starter `Todo` schema with the Dahlia Refill models and a demo seed. This is the first implementation unit. No patient UI, clinic UI, cookies, or `src/lib/refill/` in this pass.

Source of truth for models and invariants: `context/architecture.md`. This spec only decides field types, constraints, seed rows, and cleanup so implementation does not invent data.

## Why this unit first

Every later feature reads or writes these rows. `/refill` needs patients and repeat lists. `/clinic` needs orders with a public Order ID. The status machine needs the `OrderStatus` enum. The current schema cannot support any of that.

## Scope

### In

- `prisma/schema.prisma` — Clinic, Patient, Medicine, PatientRepeat, Order, OrderItem, `OrderStatus`. Remove `Todo`.
- First Prisma migration (or `db push` + sequence SQL) so `displayId` starts at **1042**.
- Partial unique index that enforces one open order per patient.
- `prisma/seed.ts` — wipe refill tables, insert the demo clinic, catalog, patients, and repeat lists. **No orders.**
- Delete `src/routes/demo/prisma.tsx` (it imports `prisma.todo` and will not compile).
- Remove the Header **Demos → Prisma** item. If that was the only demo link, remove the whole Demos dropdown. Do not restyle Header or change the homepage.

### Out

- `src/lib/refill/` (sessions, status machine, `createServerFn` handlers) — next unit.
- `/refill` and `/clinic` routes.
- `STAFF_PIN` / cookies. PIN is env, not a database row.
- WhatsApp tables or outbound messages. Ready copy is UI derived from `Order.status` + `readyAt` later.
- Seeded orders, inventory, billing, EMR, prescription expiry.
- Marketing pages at `/`.

## Schema

Keep the existing generator and datasource (`prisma-client` output at `../src/generated/prisma`, PostgreSQL). `src/db.ts` stays the Prisma singleton; this unit does not add new importers besides seed.

Use `String @id @default(cuid())` for every primary key except `Order.displayId`. Seed must set **stable string ids** (below) so later picker and tests can refer to patients by id without querying by name.

```prisma
enum OrderStatus {
  NEW
  PREPARING
  READY
  COMPLETED
  REJECTED
}

model Clinic {
  id      String  @id @default(cuid())
  name    String
  address String
  orders  Order[]
}

model Patient {
  id      String          @id @default(cuid())
  name    String
  phone   String
  repeats PatientRepeat[]
  orders  Order[]
}

model Medicine {
  id      String          @id @default(cuid())
  name    String
  strength String
  repeats PatientRepeat[]
  items   OrderItem[]
}

model PatientRepeat {
  id         String   @id @default(cuid())
  patientId  String
  medicineId String
  patient    Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medicine   Medicine @relation(fields: [medicineId], references: [id], onDelete: Restrict)

  @@unique([patientId, medicineId])
}

model Order {
  id            String      @id @default(cuid())
  displayId     Int         @unique @default(autoincrement())
  patientId     String
  clinicId      String
  status        OrderStatus
  preferredAt   DateTime
  rejectReason  String?
  readyAt       DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  patient       Patient     @relation(fields: [patientId], references: [id], onDelete: Restrict)
  clinic        Clinic      @relation(fields: [clinicId], references: [id], onDelete: Restrict)
  items         OrderItem[]
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  medicineId String
  name       String
  strength   String
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  medicine   Medicine @relation(fields: [medicineId], references: [id], onDelete: Restrict)
}
```

`OrderItem.name` and `OrderItem.strength` are snapshots copied from `Medicine` at submit time (later unit). They are required columns now so historical orders cannot depend on live catalog edits.

### Constraints this unit must create

| Invariant | How |
| --- | --- |
| `displayId` unique and permanent | `@unique`. Never update `displayId` after insert. |
| First public Order ID is `#1042` | After the `Order` table exists, restart its `displayId` sequence at 1042. No seeded orders, so the first real submit becomes 1042. |
| One open order per patient | Native SQL in the migration (Prisma cannot express a partial unique index in schema): |

```sql
CREATE UNIQUE INDEX "Order_one_open_per_patient"
ON "Order" ("patientId")
WHERE status IN ('NEW', 'PREPARING', 'READY');
```

`COMPLETED` and `REJECTED` do not count as open. A patient may have many archived orders.

Repeat-list subset and status-graph rules stay application-level (`src/lib/refill/` next). Do not add check constraints for the status graph in this unit.

### `displayId` sequence

PostgreSQL will name the autoincrement sequence something like `"Order_displayId_seq"`. Confirm the name after migrate, then:

```sql
ALTER SEQUENCE "Order_displayId_seq" RESTART WITH 1042;
```

Put this in the same migration as the tables. Do not start at 1 and “fix it later.”

## Seed

`prisma/seed.ts` remains the seed entry (`prisma.config.ts` already points at `tsx prisma/seed.ts`).

Idempotent: delete in FK-safe order (`OrderItem` → `Order` → `PatientRepeat` → Patient / Medicine / Clinic), then insert the rows below. Do not upsert against leftover `Todo` data; `Todo` is gone.

**No `Order` or `OrderItem` rows.** The client walkthrough starts from an empty clinic board.

### Clinic (one row)

| id | name | address |
| --- | --- | --- |
| `clinic_selayang` | Klinik Dahlia Selayang | No. 12, Jalan Ipoh, Selayang, 68100 Batu Caves, Selangor |

### Medicines

| id | name | strength |
| --- | --- | --- |
| `med_amlodipine_5` | Amlodipine | 5mg |
| `med_losartan_50` | Losartan | 50mg |
| `med_metformin_500` | Metformin | 500mg |
| `med_gliclazide_80` | Gliclazide | 80mg |
| `med_atorvastatin_20` | Atorvastatin | 20mg |

### Patients

| id | name | phone |
| --- | --- | --- |
| `patient_siti` | Siti Aminah | +60123456789 |
| `patient_ahmad` | Ahmad Rahman | +60132223344 |
| `patient_mei` | Mei Ling | +60165558899 |

### Repeat lists

| patient | medicines |
| --- | --- |
| Siti Aminah | Amlodipine 5mg, Losartan 50mg |
| Ahmad Rahman | Metformin 500mg, Gliclazide 80mg, Atorvastatin 20mg |
| Mei Ling | Amlodipine 5mg, Atorvastatin 20mg |

Amlodipine appears on two patients so later submit logic can prove access is via `PatientRepeat`, not the global catalog. Mei has two items so the form can submit a subset. Ahmad has three so the clinic ticket can look busy.

## Files

| File | Change |
| --- | --- |
| `prisma/schema.prisma` | Replace `Todo` with the models above |
| `prisma/migrations/…` | Create tables, enum, unique indexes, `displayId` sequence restart, partial unique index |
| `prisma/seed.ts` | Demo rows; drop todo seed |
| `src/routes/demo/prisma.tsx` | Delete |
| `src/components/Header.tsx` | Remove Demos → Prisma (and empty Demos menu) |
| `src/db.ts` | Unchanged unless generate output path forces an import tweak |

Do not add `src/lib/refill/` here. Route files still must not import Prisma after the demo page is gone.

## Verification

1. `npm run db:generate` succeeds. Generated client has no `Todo` / `todo`.
2. Migrate (or push + sequence SQL). `Order.displayId` next value is 1042.
3. `npm run db:seed` can run twice without unique errors; second run leaves the same nine people/catalog facts (1 clinic, 3 patients, 5 medicines, 7 repeats).
4. Prisma Studio (or a one-off query) shows: 0 orders; Siti has two repeats; Ahmad three; Mei two; all orders would reference `clinic_selayang`.
5. Confirm the partial unique index exists (`\d "Order"` or equivalent).
6. `npm run build` passes. `/demo/prisma` is gone. Marketing `/` still renders. Header has no dead Prisma demo link.
7. Optional smoke: insert one `NEW` order for `patient_siti` with `displayId` omitted — it should be 1042. Insert a second open order for the same patient — the unique index must reject it. Delete the smoke order before demo use (seed wipe also clears it).

## Done when

- Schema matches this spec and `architecture.md`.
- Seed is the only way demo patients exist.
- Todo demo is gone.
- No `/refill`, `/clinic`, cookies, or status-machine code shipped in this unit.

Next unit: session helpers (`dahlia_patient`, `dahlia_staff`) and the status machine in `src/lib/refill/`.
