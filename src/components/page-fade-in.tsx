import { useLocation } from "react-router"
import { motion } from "motion/react"
import { FADE_IN_S, type FadeState } from "./use-fade-navigate"

/** Fades the page up from a solid colour when it was opened via useFadeNavigate. */
export default function PageFadeIn({ colorClass }: { colorClass: string }) {
  const location = useLocation()
  const fadeIn = (location.state as FadeState | null)?.fadeIn
  if (!fadeIn) return null
  return (
    <motion.div
      // keyed per navigation so it replays when the page component is reused (month → next month)
      key={location.key}
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] ${colorClass}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: FADE_IN_S, ease: "easeOut" }}
    />
  )
}
