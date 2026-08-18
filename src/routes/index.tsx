import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react'
import HeroPortraitCarousel from '../components/HeroPortraitCarousel'

export const Route = createFileRoute('/')({ component: Home })

const TRUST_BADGES = [
  { icon: HeartPulse, label: 'Primary care across Selayang, Rawang & KL' },
  { icon: Building2, label: 'Corporate wellness & occupational health' },
  { icon: ShieldCheck, label: 'Pulse Medicare TPA' },
  { icon: GraduationCap, label: 'HRD Corp claimable training' },
]

function Home() {
  return (
    <main className="min-h-screen bg-white pb-20 text-neutral-900">
      {/* ── Trust badge strip (mobile only) ── */}
      <div className="overflow-hidden border-b border-neutral-200 py-3 lg:hidden">
        <div className="trust-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center gap-6 px-4"
              aria-hidden={copy === 1 || undefined}
            >
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <span
                  key={`${copy}-${label}`}
                  className="flex flex-shrink-0 items-center gap-2 text-[12.5px] text-neutral-600"
                >
                  <Icon size={14} strokeWidth={1.75} className="flex-shrink-0 text-neutral-400" />
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero title section ── */}
      <section className="mx-auto max-w-[1240px] px-4 pb-6 pt-6 lg:flex lg:items-start lg:justify-between lg:gap-8 lg:px-6 lg:pb-8 lg:pt-10">
        <h1 className="m-0 text-[clamp(36px,7vw,68px)] font-bold leading-[0.94] tracking-[-0.03em] text-black">
          Inspiring Better Health
        </h1>
        {/* Trust list — desktop only, right of title */}
        <ul
          className="mt-2 hidden space-y-3 text-[14px] text-neutral-500 lg:block"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon size={15} strokeWidth={1.75} className="flex-shrink-0 text-neutral-400" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Bento grid ──
          Mobile  (2-col, 3-row):  [D full-width] / [A tall-left | B top-right] / [A tall-left | C bot-right]
          Desktop (3-col, 2-row):  [A wide | D tall] / [B | C | D tall]
      */}
      <div
        className={[
          'mx-auto max-w-[1240px] px-4 lg:px-6',
          // mobile grid
          'grid gap-[10px]',
          'grid-cols-2',
          '[grid-template-rows:minmax(220px,56vw)_minmax(130px,34vw)_minmax(130px,34vw)]',
          // desktop override
          'lg:gap-[14px]',
          'lg:grid-cols-[1.12fr_1.12fr_0.95fr]',
          'lg:[grid-template-rows:minmax(340px,52vh)_minmax(168px,24vh)]',
        ].join(' ')}
      >
        {/* D — portrait card
            Mobile:  col 1–2, row 1 (full-width top)
            Desktop: col 3,   row 1–2 (tall right) */}
        <article
          className={[
            'relative overflow-hidden rounded-[24px] lg:rounded-[28px]',
            // mobile placement
            'col-span-2 row-start-1',
            // desktop placement
            'lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:row-span-2',
          ].join(' ')}
          style={{ background: '#000000' }}
        >
          <HeroPortraitCarousel />
        </article>

        {/* A — primary care network
            Mobile:  col 1, rows 2–3 (tall left)
            Desktop: col 1–2, row 1 (wide top-left) */}
        <article
          className={[
            'relative overflow-hidden rounded-[24px] lg:rounded-[28px]',
            // mobile placement
            'col-start-1 row-start-2 row-span-2',
            // desktop placement
            'lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-1',
          ].join(' ')}
          style={{ background: '#7A90A3' }}
        >
          <img
            src="/primarycare.JPG"
            alt="Doctor listening to a patient’s chest with a stethoscope"
            className="absolute inset-0 h-full w-full scale-105 object-cover object-[68%_center] lg:object-[72%_42%]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(0,0,0,0.62) 0%, rgba(122,144,163,0.28) 46%, rgba(0,0,0,0.08) 100%)',
            }}
          />
          <div className="relative z-10 p-5 lg:p-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 lg:text-[11px]">
              Network
            </p>
            <h2 className="m-0 max-w-[14ch] text-[clamp(18px,2.4vw,34px)] font-semibold leading-[1.06] text-white">
              Primary care across Selayang, Rawang & KL
            </h2>
          </div>
          {/* Mobile: pill at bottom-left. Desktop: pill at bottom-right */}
          <a
            href="/about"
            className="absolute bottom-5 left-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[13px] font-medium text-white no-underline lg:right-6 lg:bottom-6 lg:left-auto"
          >
            Our clinics <ArrowRight size={13} />
          </a>
        </article>

        {/* B — Pulse Medicare TPA
            Mobile:  col 2, row 2
            Desktop: col 1, row 2 */}
        <article
          className={[
            'relative overflow-hidden rounded-[20px] lg:rounded-[24px]',
            // mobile placement
            'col-start-2 row-start-2',
            // desktop placement
            'lg:col-start-1 lg:row-start-2',
          ].join(' ')}
          style={{ background: '#E6E6E6' }}
        >
          <img
            src="/pulse.jpg"
            alt="Portable Pulse Medicare heart-rate monitor showing an ECG waveform"
            className="absolute inset-0 h-full w-full object-cover object-[center_58%]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(230,230,230,0.92) 0%, rgba(230,230,230,0.55) 38%, rgba(0,0,0,0.12) 100%)',
            }}
          />
          <div className="relative z-10 p-4 lg:p-6">
            <h3 className="m-0 max-w-[12ch] text-[clamp(14px,1.4vw,22px)] font-semibold leading-[1.2] text-neutral-900">
              Appoint Pulse Medicare as TPA
            </h3>
          </div>
          <a
            href="/about"
            className="absolute right-3 bottom-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black text-white no-underline lg:right-4 lg:bottom-4 lg:h-10 lg:w-10"
            aria-label="Appoint Pulse Medicare as TPA"
          >
            <ArrowRight size={14} />
          </a>
        </article>

        {/* C — training card
            Mobile:  col 2, row 3
            Desktop: col 2, row 2 */}
        <article
          className={[
            'relative overflow-hidden rounded-[20px] lg:rounded-[24px]',
            // mobile placement
            'col-start-2 row-start-3',
            // desktop placement
            'lg:col-start-2 lg:row-start-2',
          ].join(' ')}
          style={{ background: '#D4C8B8' }}
        >
          <img
            src="/training.png"
            alt="Healthcare professionals in scrubs attending a training session"
            className="absolute inset-0 h-full w-full object-cover object-[18%_center]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(165deg, rgba(212,200,184,0.88) 0%, rgba(212,200,184,0.42) 42%, rgba(0,0,0,0.18) 100%)',
            }}
          />
          <div className="relative z-10 p-4 lg:p-6">
            <h3 className="m-0 max-w-[14ch] text-[clamp(14px,1.4vw,22px)] font-semibold leading-[1.2] text-neutral-900">
              HRD Corp claimable healthcare training
            </h3>
          </div>
          <a
            href="/about"
            className="absolute right-3 bottom-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black text-white no-underline lg:right-4 lg:bottom-4 lg:h-10 lg:w-10"
            aria-label="Enquire about training"
          >
            <ArrowRight size={14} />
          </a>
        </article>
      </div>
    </main>
  )
}
