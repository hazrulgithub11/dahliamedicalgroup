# UI Context

> **Two-file design system.**
> This file owns **consistency** — tokens, fonts, component shapes, and reusable UI patterns.
> Layout composition, scene-building, motion, and anti-template decisions belong at implementation time.
> When both apply, use this file for *what things look like* and composition rules for *how they are arranged*.

**Reference:** Ro (ro.co) mobile — slim announcement bar, centered wordmark, monumental data overlapping objects, white tool-card on a grey field, full-width black pill CTAs. Dahlia Refill inherits this language using Dahlia's lime/slate/sand palette, not Ro's coral.

The homepage at `/` already follows this family (`#E4EE8F` lime bar, hamburger + wordmark, 24 px bento, black pills). Product routes at `/refill` and `/clinic` continue as an *app* — same look, no marketing chrome.

## Theme

**Light only** on `/refill` and `/clinic`. Clinical-consumer, not a SaaS dashboard: lots of white, one accent colour (lime), black type, quiet pastels for surfaces.

- Ro's yellow bar → Dahlia lime `#E4EE8F`
- Ro's coral → black pills + lime fills (never coral or teal)
- The lagoon/palm tokens in `src/styles.css` are for the marketing homepage only — do not use them on product routes
- Dark mode is unused on `/refill` and `/clinic`

## Colors

All product UI must use these CSS variables. No hardcoded hex in component code.

| Role                         | CSS Variable        | Value                    |
| ---------------------------- | ------------------- | ------------------------ |
| Page background              | `--bg-base`         | `#ffffff`                |
| Grey section field           | `--bg-grey`         | `#f4f4f4`                |
| Surface (cards, tickets)     | `--bg-surface`      | `#ffffff`                |
| Muted / archived             | `--bg-muted`        | `#E6E6E6`                |
| Lime accent                  | `--bg-lime`         | `#E4EE8F`                |
| Slate (Preparing)            | `--bg-slate`        | `#7A90A3`                |
| Sand (warm secondary)        | `--bg-sand`         | `#D4C8B8`                |
| Primary text                 | `--text-primary`    | `#000000`                |
| Muted text                   | `--text-muted`      | `#525252`                |
| CTA pill fill                | `--accent-primary`  | `#000000`                |
| Lime accent                  | `--accent-lime`     | `#E4EE8F`                |
| Border                       | `--border-default`  | `#e5e5e5`                |
| Ready / OK state (bg + text) | `--state-ok-bg`     | `#dceee4`                |
|                              | `--state-ok-text`   | `#2f6a4a`                |
| Error / Reject               | `--state-error`     | `#8B3A2A`                |

**Status colour mapping:**

| Status    | Surface treatment                                          |
| --------- | ---------------------------------------------------------- |
| New       | Lime strip / `--bg-lime` tint                             |
| Preparing | Slate `--bg-slate`                                        |
| Ready     | Black type, lime Order ID, mint `--state-ok` pill         |
| Rejected  | Terracotta `--state-error`                                 |
| Completed | Muted `--bg-muted` — off the live board, archived         |

## Typography

Fonts are already loaded in `src/styles.css`. No new font requests.

| Role                | Font         | Notes                                          |
| ------------------- | ------------ | ---------------------------------------------- |
| UI text / body      | **Inter**    | Default throughout. Ro-like geometric sans.     |
| Display / marketing | **Fraunces** | Marketing headlines only. Not used on Order IDs |
| Order ID            | Inter 800    | Extra-bold, tight tracking — like Ro's `20%`   |

**Type scale registers:**

| Register   | Approx. size              | Where used                                                    |
| ---------- | ------------------------- | ------------------------------------------------------------- |
| Monumental | `clamp(64px, 22vw, 140px)`| Order ID on the patient Ready screen                          |
| Editorial  | `clamp(24px, 4vw, 40px)`  | "Request a refill", "Your order is ready"                     |
| Body large | `1.125rem – 1.25rem`      | Medicine names, patient names on clinic tickets               |
| Body       | `1rem`                    | Form labels, Kanban copy, action text                         |
| Fine       | `0.75rem – 0.8125rem`     | Timestamps, phone numbers, "preference only" captions         |

**`/refill` minimums:** 16 px body, 44 px-tall primary actions, full-width black pill CTA like Ro's "Start your journey".

## Border Radius

| Context                               | Value               |
| ------------------------------------- | ------------------- |
| Pills / buttons                       | `rounded-full`      |
| Tool cards, WhatsApp preview, panels  | `rounded-[24px]`    |
| Clinic tickets / slips                | `rounded-[20px]`    |
| Inputs, PIN field                     | `rounded-[12px]`    |

## Component Library

**No shadcn.** There is no `src/components/ui/` directory. Product controls are small local pieces living in `src/components/refill/`:

- `PillButton` — full-width or auto-width `rounded-full` black pill, white label
- `LimeBanner` — `--bg-lime` strip: wordmark or clinic name + optional action
- `MedicineRow` — checkable row: name + strength, `body-large` type
- `ResultCard` — white `rounded-[24px]` on `--bg-grey`; Ro calculator pattern with large number derived from selection
- `TicketSlip` — Kanban ticket: `rounded-[20px]`, pastel surface, patient name, medicines, slot, Order ID, action pill
- `StatusPill` — dot + label, small, uses state tokens (mint/lime/terracotta/muted)
- `WhatsAppPreview` — green-bubble object placed over the Order ID, not a centered modal
- `PinField` — large digit input + black confirm pill

Icons: Lucide React, stroke only. `h-4 w-4` inline, `h-5 w-5` on buttons.

## Layout Patterns

> One scene per screen. Huge number as the subject. Objects and type may overlap. White card on a grey field for interactive bits. Sticky black pill at the bottom. No equal-column card grids.

### Product Chrome (not the marketing Header)

A slim product bar on `/refill` and `/clinic` only:

- Left: Dahlia wordmark
- Centre (mobile): wordmark centred (Ro pattern)
- Right: account icon or "Logout" text
- Below on `/refill`: optional lime clinic strip with the clinic name
- No marketing nav links, no theme toggle, no phone/call CTA

### Patient `/refill` (phone-first)

- Single column, `max-w-[430px]`, padded 16–20 px. Not a card grid.
- **Picker:** Stacked large name rows. Not three equal profile tiles.
- **Request form:** White `rounded-[24px]` card on a `--bg-grey` section. Medicines as a vertical checklist. Selected count shown as a large number in the card (Ro calculator pattern). One preferred slot field. Sticky full-width black "Submit request" pill at the bottom.
- **Status / Ready:** Order ID rendered at monumental scale — it is the scene. The status word ("Ready for pickup") and the WhatsApp bubble are placed over or beside the number, not in a separate panel. Mint `StatusPill` for Ready. Terracotta reason text for Rejected, in the same card language, not an error toast.

### Clinic `/clinic` (tablet / desktop workbench)

- Full-viewport. Same type language, same pills. Not a Trello clone.
- **Kanban:** Three uneven columns — New wider (lime-tinted, incoming pile), Preparing medium (slate), Ready narrower (oversized Order IDs on each slip).
- **Tickets:** `TicketSlip` — pastel surface, `StatusPill`, patient name, meds, slot, Order ID. Primary action is a black pill on the slip. Reject is a quiet underline text link, not a red button row.
- **PIN screen:** Large digit field centred on a white page. Black confirm pill. Not a floating login card on a grey void.

### Anti-patterns — Do Not

- Equal 3-column card grids
- Coral or orange accents
- Glowing gradients
- Generic dashboard sidebar or top nav
- Centred login card on a grey void
- Copying Ro's 2 × 3 product shop grid

## Icons

Lucide React. Stroke-based only. Sizes: `h-4 w-4` for inline text, `h-5 w-5` for button icons. No filled or duotone icons.

## Scope Note

The marketing homepage at `/` is **frozen** in this step. It already follows the Ro-adjacent family. Tokens in this document apply to `/refill` and `/clinic` product routes. A later pass may unify tokens across both surfaces.
