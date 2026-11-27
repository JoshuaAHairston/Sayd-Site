// Port of https://github.com/olivierlarose/zoom-parallax (Next.js + SCSS modules)
// to Vite + Tailwind + `motion`. Same mechanics: a tall container with a sticky
// full-screen stage; as you scroll through it, seven tiles scale up at different
// rates. The centre tile scales exactly 4x (25vw x 25vh -> full screen).

import * as React from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"

/** Tile layout from the original stylesheet: offset from centre + size. */
const TILES: { top: string; left: string; width: string; height: string; scaleTo: number }[] = [
  { top: "0vh", left: "0vw", width: "25vw", height: "25vh", scaleTo: 4 }, // centre
  { top: "-30vh", left: "5vw", width: "35vw", height: "30vh", scaleTo: 5 },
  { top: "-10vh", left: "-25vw", width: "20vw", height: "45vh", scaleTo: 6 },
  { top: "0vh", left: "27.5vw", width: "25vw", height: "25vh", scaleTo: 5 },
  { top: "27.5vh", left: "5vw", width: "20vw", height: "25vh", scaleTo: 6 },
  { top: "27.5vh", left: "-22.5vw", width: "30vw", height: "25vh", scaleTo: 8 },
  { top: "22.5vh", left: "25vw", width: "15vw", height: "15vh", scaleTo: 9 },
]

function Tile({
  src,
  tile,
  progress,
  children,
}: {
  src: string
  tile: (typeof TILES)[number]
  progress: MotionValue<number>
  children?: React.ReactNode
}) {
  const scale = useTransform(progress, [0, 1], [1, tile.scaleTo])
  return (
    // No will-change-transform here: it makes the browser draw each tile once at
    // its small starting size and stretch that bitmap up to 9×, so photos turn
    // blurry and blocky. Without it, the browser redraws at the current scale.
    <motion.div style={{ scale }} className="absolute inset-0 flex items-center justify-center">
      <div
        className="relative overflow-hidden"
        style={{ top: tile.top, left: tile.left, width: tile.width, height: tile.height }}
      >
        <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
        {children}
      </div>
    </motion.div>
  )
}

export interface ZoomParallaxProps {
  /** up to 7 images; the first is the centre tile that fills the screen */
  images: string[]
  /** big label over the centre tile, fades out as you zoom */
  title?: string
  eyebrow?: string
  /** height of the scroll runway, default 200vh: one screen of scrolling (the original used 300vh) */
  runway?: string
}

export function ZoomParallax({ images, title, eyebrow, runway = "200vh" }: ZoomParallaxProps) {
  const container = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] })

  const labelOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0])

  // repeat images if there are fewer than seven
  const srcs = TILES.map((_, i) => images[i % Math.max(images.length, 1)])

  return (
    <div ref={container} className="relative" style={{ height: runway }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        {TILES.map((tile, i) =>
          srcs[i] ? (
            <Tile key={i} src={srcs[i]} tile={tile} progress={scrollYProgress}>
              {i === 0 && (title || eyebrow) && (
                <motion.div
                  style={{ opacity: labelOpacity }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-center text-white"
                >
                  {eyebrow && <p className="text-[1.4vh] uppercase tracking-[0.3em] text-white/80">{eyebrow}</p>}
                  {title && <p className="text-[3.4vh] font-semibold leading-tight tracking-tight">{title}</p>}
                </motion.div>
              )}
            </Tile>
          ) : null,
        )}

        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-sm text-white/80"
        >
          <span>Scroll to zoom in</span>
          <motion.span
            className="block h-6 w-px bg-white/70"
            animate={{ scaleY: [0.3, 1, 0.3], originY: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default ZoomParallax
