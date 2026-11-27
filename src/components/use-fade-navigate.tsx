import { useState, type MouseEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router"
import { motion, useReducedMotion } from "motion/react"
import { BLACK, WHITE, usePhoneEdges } from "./phone-edge-color"

/** Seconds for the outgoing page to fade to a solid colour. */
export const FADE_OUT_S = 0.5
/** Seconds for the incoming page to fade up from that colour. */
export const FADE_IN_S = 0.7

/** Router state flag that tells the next page to fade in. */
export type FadeState = { fadeIn?: boolean }

/**
 * Navigate after covering the page with a solid colour.
 * Render `overlay` somewhere in the component; call `fadeTo(href)` to go, or
 * spread `fadeLink(href)` onto a <Link> to fade on a normal click.
 * The destination should render <PageFadeIn> (page-fade-in.tsx) with the same colour.
 */
export function useFadeNavigate(colorClass: string) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  // Remember which page we started leaving, not just "leaving": when the route
  // stays on the same component (one month → the next), it isn't remounted, and
  // a plain boolean would leave the overlay covering the new page.
  const [leavingFrom, setLeavingFrom] = useState<string | null>(null)
  const leaving = leavingFrom === location.key
  // phone edges switch to the destination colour as soon as the fade starts
  usePhoneEdges(leaving ? (colorClass === "bg-black" ? BLACK : WHITE) : null)

  const fadeTo = (to: string) => {
    if (leaving) return
    if (reduceMotion) return navigate(to)
    setLeavingFrom(location.key)
    // a timer rather than onAnimationComplete, so navigation still happens if
    // animation frames are paused (e.g. the tab is backgrounded mid-fade)
    window.setTimeout(() => navigate(to, { state: { fadeIn: true } satisfies FadeState }), FADE_OUT_S * 1000)
  }

  const overlay: ReactNode = leaving
    ? createPortal(
        // portalled to <body> so a transformed ancestor can't trap `fixed`
        <motion.div
          aria-hidden
          className={`fixed inset-0 z-[100] ${colorClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FADE_OUT_S, ease: "easeInOut" }}
        />,
        document.body,
      )
    : null

  /** Props for a <Link>: fades on a plain click, lets cmd/ctrl/shift-clicks open new tabs as usual. */
  const fadeLink = (to: string) => ({
    to,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      fadeTo(to)
    },
  })

  return { fadeTo, fadeLink, overlay }
}
