import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react"
import { BLACK, WHITE, usePhoneEdges } from "../components/phone-edge-color"
import Floating, { FloatingElement } from "../components/parallax-floating"
import { LiquidMetalButton } from "../components/liquid-metal-button"
import ZoomThroughTransition from "../components/zoom-through-transition"
import { getHeroImages } from "../data/photos"

/** Slot layout from the 21st.dev demo: position, size and parallax depth. */
const SLOTS = [
  { depth: 0.5, pos: "top-[8%] left-[11%]", size: "w-16 h-16 md:w-24 md:h-24" },
  { depth: 1, pos: "top-[10%] left-[32%]", size: "w-20 h-20 md:w-28 md:h-28" },
  { depth: 2, pos: "top-[2%] left-[53%]", size: "w-28 h-40 md:w-40 md:h-52" },
  { depth: 1, pos: "top-[0%] left-[83%]", size: "w-24 h-24 md:w-32 md:h-32" },
  { depth: 1, pos: "top-[40%] left-[2%]", size: "w-28 h-28 md:w-36 md:h-36" },
  { depth: 2, pos: "top-[70%] left-[77%]", size: "w-28 h-28 md:w-36 md:h-48" },
  { depth: 4, pos: "top-[73%] left-[15%]", size: "w-40 h-48 md:w-52 md:h-64" },
  { depth: 1, pos: "top-[80%] left-[50%]", size: "w-24 h-24 md:w-32 md:h-32" },
]

export default function HeroPage() {
  const [scope, animate] = useAnimate()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [zooming, setZooming] = useState(false)
  const images = getHeroImages()
  const [endingOnWhite, setEndingOnWhite] = useState(false)
  usePhoneEdges(endingOnWhite ? WHITE : BLACK, endingOnWhite ? { duration: 0.54 } : undefined)

  // the zoom fades to white over its last 30% (of 1800ms): fade the edges with it
  useEffect(() => {
    if (!zooming) return
    const timer = window.setTimeout(() => setEndingOnWhite(true), 1260)
    return () => window.clearTimeout(timer)
  }, [zooming])

  useEffect(() => {
    animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) })
  }, [animate])

  const start = () => {
    if (zooming) return
    if (reduceMotion) navigate("/years", { state: { fromHero: true } })
    else setZooming(true)
  }

  return (
    // the white/black backdrop is what's revealed as the scene zooms past —
    // it matches the years page background so the hand-off is seamless
    <main className="relative h-dvh w-full overflow-hidden bg-white">
      <ZoomThroughTransition
        active={zooming}
        onDone={() => navigate("/years", { state: { fromHero: true } })}
        className="absolute inset-0 flex items-center justify-center"
        backdropClassName="absolute inset-0 bg-black"
      >
        <div ref={scope} className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative z-50 flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.88, delay: 1.5 }}
          >
            <h1 className="text-6xl font-medium italic tracking-tight text-white md:text-8xl">A Journey.</h1>
            <LiquidMetalButton label="Start Journey" onClick={start} />
          </motion.div>

          <Floating sensitivity={-1} className="overflow-hidden">
            {SLOTS.map((slot, i) => (
              <FloatingElement key={i} depth={slot.depth} className={slot.pos}>
                <motion.img
                  initial={{ opacity: 0 }}
                  src={images[i]}
                  alt=""
                  draggable={false}
                  className={`${slot.size} cursor-pointer object-cover transition-transform duration-200 hover:scale-105`}
                />
              </FloatingElement>
            ))}
          </Floating>
        </div>
      </ZoomThroughTransition>
    </main>
  )
}
