import { HeadContent, Scripts, createRootRoute, useMatch } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var p=location.pathname;if(p==='/refill'||p==='/clinic'||p.indexOf('/refill/')===0||p.indexOf('/clinic/')===0){var r=document.documentElement;r.classList.remove('dark');r.classList.add('light');r.style.colorScheme='light';return;}var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Dahlia Medical Group',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const isHome = useMatch({ from: '/', shouldThrow: false })
  const isRefill = useMatch({ from: '/refill', shouldThrow: false })
  const isClinic = useMatch({ from: '/clinic', shouldThrow: false })
  const isProduct = Boolean(isRefill || isClinic)

  return (
    <html lang="en" className={isProduct ? 'light' : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        className={
          isProduct
            ? 'product-app font-sans antialiased [overflow-wrap:anywhere] selection:bg-[var(--bg-lime)]'
            : 'font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]'
        }
      >
        {!isProduct && <Header />}
        {children}
        {!isHome && !isProduct && <Footer />}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
