import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const SLIDES = [
  {
    src: '/kedai.jpeg',
    alt: 'Klinik Keluarga Dr Dahlia storefront in Selayang',
    objectPosition: 'object-[center_38%]',
  },
  {
    src: '/image2.png',
    alt: 'Healthcare professionals in a hands-on training workshop',
    objectPosition: 'object-[center_42%]',
  },
  {
    src: '/image3.png',
    alt: 'Dahlia Medical Group team with the Ministry of Health Malaysia',
    objectPosition: 'object-[center_32%]',
  },
] as const

const INTERVAL_MS = 4500

export default function HeroPortraitCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches || paused) {
      return
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length)
    }, INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [index, paused])

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, slideIndex) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={[
            'absolute inset-0 h-full w-full scale-105 object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
            slide.objectPosition,
            slideIndex === index ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-hidden={slideIndex !== index || undefined}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.32) 100%)',
        }}
      />
      <h2 className="absolute top-5 left-5 z-10 m-0 max-w-[12ch] text-[clamp(18px,3.5vw,28px)] font-semibold leading-[1.1] text-white lg:top-7 lg:left-7">
        Selayang · KL · Rawang
      </h2>
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-0.5">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show photo ${slideIndex + 1} of ${SLIDES.length}`}
            aria-current={slideIndex === index ? 'true' : undefined}
            onClick={() => setIndex(slideIndex)}
            className="grid h-6 w-6 place-items-center rounded-full border-0 bg-transparent p-0"
          >
            <span
              className={[
                'h-2 w-2 rounded-full transition-colors',
                slideIndex === index ? 'bg-white' : 'bg-white/50',
              ].join(' ')}
            />
          </button>
        ))}
      </div>
      <a
        href="tel:+60361207630"
        className="absolute right-5 bottom-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-black no-underline lg:right-6 lg:bottom-6"
      >
        Contact us <ArrowRight size={13} />
      </a>
    </div>
  )
}
