import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router"
import { animate, motion, type AnimationPlaybackControls } from "motion/react"
import YearTimeline from "../components/year-timeline"
import PageFadeIn from "../components/page-fade-in"
import LiquidNavbar from "../components/liquid-glass-navbar"
import { YEARS, getMonthThumbnails } from "../data/photos"

/** Seconds the year links take to scroll; the browser's own smooth scroll is faster and can't be slowed. */
const YEAR_SCROLL_S = 1.4
let yearScroll: AnimationPlaybackControls | undefined

/** Index into YEARS of the section filling most of the screen (its top has passed 40% of the way down). */
function yearInView() {
  let index = 0
  YEARS.forEach((y, i) => {
    const el = document.getElementById(`year-${y}`)
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) index = i
  })
  return index
}

/** Smoothly scroll to a year's section; `onDone` runs when it lands or the visitor interrupts. */
function scrollToYear(year: number, onDone: () => void) {
  const el = document.getElementById(`year-${year}`)
  if (!el) return onDone()
  // keep the URL shareable without triggering a router navigation
  window.history.replaceState(window.history.state, "", `#year-${year}`)

  // land where scrollIntoView would, honouring the section's scroll-margin (clears the sticky nav).
  // Measured every frame, so images or buttons settling mid-scroll can't leave it short.
  const target = () =>
    el.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(el).scrollMarginTop || "0")
  yearScroll?.stop()
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, target())
    return onDone()
  }

  // the visitor scrolling, swiping or pressing a key takes back control
  const cancel = () => {
    yearScroll?.stop()
    onDone()
  }
  const events = ["wheel", "touchstart", "keydown"] as const
  events.forEach((ev) => window.addEventListener(ev, cancel, { once: true, passive: true }))
  const start = window.scrollY
  yearScroll = animate(0, 1, {
    duration: YEAR_SCROLL_S,
    ease: [0.65, 0, 0.35, 1], // ease in and out
    onUpdate: (p) => window.scrollTo(0, start + (target() - start) * p),
    onComplete: () => {
      events.forEach((ev) => window.removeEventListener(ev, cancel))
      onDone()
    },
  })
}

export default function YearsPage() {
  const fromHero = (useLocation().state as { fromHero?: boolean } | null)?.fromHero

  // the water drop follows the year you're scrolled into…
  const [activeYear, setActiveYear] = useState(0)
  // …except during a click's auto-scroll, where it stays on the year you picked
  const autoScrolling = useRef(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (!autoScrolling.current) setActiveYear(yearInView())
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    frame = requestAnimationFrame(update) // also handles arriving at #year-2026 or a month card
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const goToYear = (index: number) => {
    setActiveYear(index)
    autoScrolling.current = true
    scrollToYear(YEARS[index], () => {
      autoScrolling.current = false
      setActiveYear(yearInView())
    })
  }

  return (
    <>
      <motion.main
        // finishes the hero's zoom-through: the page settles in from slightly enlarged
        initial={fromHero ? { opacity: 0, scale: 1.06 } : false}
        animate={{ opacity: 1, scale: 1 }}
        // slow on purpose so the zoom-out onto "Our Timeline." really lands
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* the month page's back link fades out to this page's background */}
        <PageFadeIn colorClass="bg-white" />
        <h1 className="bg-white px-8 pt-16 text-center text-6xl font-medium italic tracking-tight text-neutral-900 md:pt-20 md:text-8xl">
          Our Timeline.
        </h1>
        {YEARS.map((y) => (
          <YearTimeline key={y} year={y} images={getMonthThumbnails(y)} className="scroll-mt-4" />
        ))}
        <footer className="pt-10 pb-28 text-center text-sm text-neutral-400">
          <Link to="/" className="hover:text-neutral-700">Back to the start</Link>
        </footer>
      </motion.main>
        {/* outside <main>: its entry zoom is a transform, which would pin a fixed child to it instead of the screen.
            Floats at the bottom centre; the wrapper ignores clicks so only the pill blocks the page */}
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center">
          <LiquidNavbar
            className="pointer-events-auto"
            ariaLabel="Years"
            tone="light"
            compact={false} // years have no icons, so always show the labels
            items={YEARS.map((y) => ({ label: String(y), fx: "none" }))}
            active={activeYear}
            onSelect={goToYear}
          />
        </div>
    </>
  )
}
