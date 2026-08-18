import { useEffect, useState } from 'react'
import { Link, useMatch } from '@tanstack/react-router'
import { CircleUserRound } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  'About Us',
  'Primary Care',
  'Services',
  'Pulse Medicare',
  'Training',
  'Diagnostics',
  'Wellness Tourism',
  'Contact Us',
]

function navHref(item: string) {
  if (item === 'Contact Us') return 'tel:+60361207630'
  if (item === 'About Us') return '/about'
  return '/'
}

function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = () => {
      if (mq.matches) setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [menuOpen])

  return (
    <header className="w-full bg-white">
      {/* Lime promo banner */}
      <div className="home-enter home-enter-fade home-enter-delay-0 bg-[#E4EE8F] py-2.5 text-center text-[13px] leading-none text-neutral-800">
        Clinics in Selayang, Rawang and Menara MATRADE.{' '}
        <a
          href="tel:+60361207630"
          className="text-neutral-800 underline decoration-neutral-800 underline-offset-2"
        >
          Call 03-6120 7630
        </a>
        .
      </div>

      {/* Nav bar */}
      <nav className="home-enter home-enter-rise home-enter-delay-1 relative mx-auto flex h-14 max-w-[1240px] items-center px-4 lg:h-16 lg:px-6">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          className="home-nav-toggle relative z-[60] flex h-8 w-8 flex-col items-center justify-center lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="home-nav-drawer"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className={`block h-[1.5px] w-5 bg-neutral-900 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              menuOpen ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`mt-[5px] block h-[1.5px] w-5 bg-neutral-900 transition-opacity duration-200 ${
              menuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`mt-[5px] block h-[1.5px] w-5 bg-neutral-900 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </button>

        {/* Logo — centered on mobile, left-aligned on desktop */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 no-underline lg:static lg:translate-x-0"
        >
          <img
            src="/logo.png"
            alt="Dahlia Medical Group"
            className="h-10 w-auto object-contain lg:h-12"
          />
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <ul
          className="ml-10 hidden items-center gap-6 lg:flex"
          style={{ listStyle: 'none', margin: '0 0 0 2.5rem', padding: 0 }}
        >
          {NAV_LINKS.map((item) => (
            <li key={item}>
              <a
                href={navHref(item)}
                className="whitespace-nowrap text-[13.5px] font-medium text-neutral-800 no-underline hover:text-black"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* Profile icon */}
        <a
          href="tel:+60361207630"
          className="relative z-[60] ml-auto rounded-full p-1 text-neutral-800 no-underline hover:text-black"
          aria-label="Call Dahlia Medical Group"
        >
          <CircleUserRound size={22} strokeWidth={1.5} />
        </a>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* Drawer */}
      <aside
        id="home-nav-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(80vw,20rem)] flex-col bg-white pt-[4.5rem] shadow-[8px_0_32px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <ul className="m-0 flex list-none flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((item, index) => (
            <li
              key={item}
              style={{
                transitionDelay: menuOpen ? `${80 + index * 40}ms` : '0ms',
              }}
              className={`transition-[opacity,transform] duration-300 ease-out ${
                menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
              }`}
            >
              <a
                href={navHref(item)}
                className="block py-3 text-[22px] font-semibold tracking-tight text-neutral-900 no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </header>
  )
}

export default function Header() {
  const isHome = useMatch({ from: '/', shouldThrow: false })

  if (isHome) {
    return <HomeHeader />
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Dahlia Medical Group
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Home
          </Link>
          <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            About
          </Link>
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/overview"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
