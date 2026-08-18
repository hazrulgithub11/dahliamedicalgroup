# 03 — Hide marketing Header/Footer

Product routes must not render the marketing Header, Footer, or theme toggle. This is the third implementation unit. Create `/refill` and `/clinic` as empty canvases so the match exists; do not build the picker, PIN, Kanban, or the slim product bar yet.

Source of truth: `context/architecture.md` invariant 7 and `context/ui-context.md` (marketing chrome vs product app). This spec only decides how `__root.tsx` detects product routes, what the stub pages contain, and how product tokens are scoped so later screens do not inherit lagoon/palm.

## Why this unit now

`__root.tsx` always mounts `Header`. `/about` also gets `Footer` and `ThemeToggle`. If `/refill` and `/clinic` ship under that shell, the demo shows marketing nav, a TanStack Docs link, and a theme toggle on a clinical-consumer app. Architecture forbids that. Hide the shell before any product UI, so units 04 and 05 compose against a blank app canvas.

## Scope

### In

- `src/routes/__root.tsx` — do not render marketing Header or Footer on `/refill` or `/clinic` (and descendants).
- Force light colour scheme on those paths (theme script + `html` class).
- Scope product CSS tokens under a `.product-app` class so marketing `:root` tokens stay untouched.
- Stub routes `src/routes/refill.tsx` (`/refill`) and `src/routes/clinic.tsx` (`/clinic`) — title + empty canvas only.

### Out

- Slim product chrome (`LimeBanner`, wordmark bar, Logout). Units 04/05.
- Patient picker, request form, status, WhatsApp preview.
- Clinic PIN, Kanban, ticket actions.
- Calling session `createServerFn`s from these stubs. No cookie checks yet.
- Restyling `Header.tsx`, `Footer.tsx`, or the homepage at `/`.
- Hiding TanStack Devtools.
- Prisma, schema, seed, `src/lib/refill/` changes.

## Detection (one place)

Keep the chrome decision in `__root.tsx` only. Do not add `useMatch` for `/refill` or `/clinic` inside `Header.tsx`.

Use the same `useMatch` pattern already used for home:

```tsx
const isHome = useMatch({ from: '/', shouldThrow: false })
const isRefill = useMatch({ from: '/refill', shouldThrow: false })
const isClinic = useMatch({ from: '/clinic', shouldThrow: false })
const isProduct = Boolean(isRefill || isClinic)
```

Render rules:

| Route | Header | Footer | ThemeToggle |
| --- | --- | --- | --- |
| `/` | yes (home variant inside Header) | no (existing `!isHome`) | no (home Header has none) |
| `/about` | yes (non-home Header) | yes | yes (inside non-home Header) |
| `/refill` | **no** | **no** | **no** |
| `/clinic` | **no** | **no** | **no** |

```tsx
{!isProduct && <Header />}
{children}
{!isHome && !isProduct && <Footer />}
```

`isRefill` / `isClinic` are exact file-route matches. This unit only adds leaf routes `/refill` and `/clinic`. If a later unit adds child routes, convert those files to layout routes (`Outlet`) so the parent `from` still matches — not this unit.

## Light-only on product paths

Product UI is light-only (`ui-context.md`). `THEME_INIT_SCRIPT` currently reads `localStorage.theme` and may add `.dark` before React hydrates. On product paths that would flash dark lagoon tokens.

Extend the existing IIFE **at the top**, before the stored-theme logic:

- If `location.pathname` is `/refill`, `/clinic`, or a prefix `/refill/` / `/clinic/`, then: remove `.dark`, add `.light`, set `colorScheme` to `light`, and **return** (do not apply stored theme).
- All other paths: keep today’s theme script unchanged.

Do not delete `ThemeToggle` or the script for marketing pages.

On the `<html>` element, when `isProduct` is true, also set `className` to include `light` (keep `suppressHydrationWarning`). Do not strip `.light`/`.dark` handling for `/` and `/about`.

## Product token scope

`:root` already defines `--bg-base` as marketing foam green (`#e7f3ec`). Product `--bg-base` is white (`#ffffff`). **Do not overwrite `:root`.** Add a scoped block in `src/styles.css`:

```css
.product-app {
  --bg-base: #ffffff;
  --bg-grey: #f4f4f4;
  --bg-surface: #ffffff;
  --bg-muted: #e6e6e6;
  --bg-lime: #e4ee8f;
  --bg-slate: #7a90a3;
  --bg-sand: #d4c8b8;
  --text-primary: #000000;
  --text-muted: #525252;
  --accent-primary: #000000;
  --accent-lime: #e4ee8f;
  --border-default: #e5e5e5;
  --state-ok-bg: #dceee4;
  --state-ok-text: #2f6a4a;
  --state-error: #8b3a2a;

  min-height: 100dvh;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

Hex values match `ui-context.md`. They live in CSS only — still no hardcoded hex in component TSX.

When `isProduct`, add `product-app` to `<body>` (keep `font-sans antialiased [overflow-wrap:anywhere]`). Change selection on that body from lagoon `rgba(79,184,178,0.24)` to `var(--bg-lime)`. Marketing body classes stay as they are today.

## Stub routes

Two leaf file routes, same shape as `src/routes/about.tsx`. `routeTree.gen.ts` is generated — do not hand-edit.

### `src/routes/refill.tsx`

- `createFileRoute('/refill')`
- `head.title`: `Refill · Dahlia Medical Group`
- Component: a `<main>` only. No Header clone. No session calls.
- Visible copy, exactly: heading `Refill`, one line of muted body `Patient app`. Nothing else (no buttons, no picker names, no Order ID).

### `src/routes/clinic.tsx`

- `createFileRoute('/clinic')`
- `head.title`: `Clinic · Dahlia Medical Group`
- Component: a `<main>` only.
- Visible copy, exactly: heading `Clinic`, one line of muted body `Staff board`. Nothing else (no PIN field, no columns).

Stub layout (both pages):

- Single column, padded 16–20 px, `max-w-[430px]` on `/refill`, full width on `/clinic`.
- Type: Inter. Heading uses editorial scale (`text-2xl` / `font-semibold` is enough). Body uses `text-[var(--text-muted)]`.
- No Fraunces. No lagoon/palm/`--sea-ink`. No equal card grid. No product `LimeBanner`.

These stubs exist so chrome can be verified. Units 04 and 05 replace the stub component bodies (same route files).

## Files

| File | Change |
| --- | --- |
| `src/routes/__root.tsx` | `isProduct` match; hide Header/Footer; `product-app` on body; force `light` on `html`; extend theme IIFE for product paths |
| `src/routes/refill.tsx` | Create stub `/refill` |
| `src/routes/clinic.tsx` | Create stub `/clinic` |
| `src/styles.css` | Add `.product-app { … }` token block only. Do not change `:root` or homepage classes |
| `src/components/Header.tsx` | Unchanged |
| `src/components/Footer.tsx` | Unchanged |
| `src/routes/index.tsx` | Unchanged |

## Verification

1. `npm run build` passes. `routeTree.gen.ts` includes `/refill` and `/clinic`.
2. Open `/` — lime marketing Header still there. No Footer. Homepage layout unchanged.
3. Open `/about` — non-home Header (Home / About / Docs + ThemeToggle) and Footer still there.
4. Open `/refill` — no marketing Header, no Footer, no theme toggle, no Docs link, no phone CTA. Page shows only `Refill` / `Patient app` on a white canvas. Document title is `Refill · Dahlia Medical Group`.
5. Open `/clinic` — same chrome absence. Copy is `Clinic` / `Staff board`. Title is `Clinic · Dahlia Medical Group`.
6. On `/refill` and `/clinic`: `<body>` has class `product-app`; `<html>` is `.light` not `.dark` even if `localStorage.theme` is `dark`. `/about` still respects the stored theme.
7. Grep: stub routes do not import `Header`, `Footer`, `ThemeToggle`, `src/db.ts`, or `#/lib/refill/session.ts`. They may import `createFileRoute` only.

## Done when

- Marketing chrome is gone on `/refill` and `/clinic` and still present on `/` and `/about`.
- Product tokens are scoped under `.product-app`. Marketing `:root` tokens are unchanged.
- Stubs are placeholders, not the patient or clinic product.
- No session, status-machine, or Prisma usage from these routes.

Next unit: patient `/refill` — picker → request form → status (including simulated WhatsApp on Ready), including the slim product bar and Logout for the patient cookie.
