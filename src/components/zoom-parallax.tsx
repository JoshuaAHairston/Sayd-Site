// Port of https://github.com/olivierlarose/zoom-parallax (Next.js + SCSS modules)
// to Vite + Tailwind + `motion`. Same mechanics: a tall container with a sticky
// full-screen stage; as you scroll through it, seven tiles scale up at different
// rates. The centre tile scales exactly 4x (25vw x 25vh -> full screen).

import * as React from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"

/** Tile layout from the original stylesheet: offset from centre (vw / vh) + size. */
const TILES: { top: number; left: number; width: number; height: number; scaleTo: number }[] = [
  { top: 0, left: 0, width: 25, height: 25, scaleTo: 4 }, // centre
  { top: -30, left: 5, width: 35, height: 30, scaleTo: 5 },
  { top: -10, left: -25, width: 20, height: 45, scaleTo: 6 },
  { top: 0, left: 27.5, width: 25, height: 25, scaleTo: 5 },
  { top: 27.5, left: 5, width: 20, height: 25, scaleTo: 6 },
  { top: 27.5, left: -22.5, width: 30, height: 25, scaleTo: 8 },
  { top: 22.5, left: 25, width: 15, height: 15, scaleTo: 9 },
]

function Tile({
  src,
  tile,
  drawScale,
  progress,
  children,
}: {
  src: string
  tile: (typeof TILES)[number]
  /** how much bigger than its starting size the tile is drawn */
  drawScale: number
  progress: MotionValue<number>
  children?: React.ReactNode
}) {
  const zoom = useTransform(progress, [0, 1], [1, tile.scaleTo])
  const x = useTransform(zoom, (z) => `${tile.left * z}vw`)
  const y = useTransform(zoom, (z) => `${tile.top * z}vh`)
  const scale = useTransform(zoom, (z) => z / drawScale)
  const width = tile.width * drawScale
  const height = tile.height * drawScale
  return (
    // will-change lets the phone's GPU move and resize the tile without redrawing
    // it on every scroll frame. The tile is drawn larger and scaled down, so it
    // stays sharp as it grows.
    <motion.div
      className="absolute left-1/2 top-1/2 overflow-hidden will-change-transform"
      style={{
        width: `${width}vw`,
        height: `${height}vh`,
        marginLeft: `${-width / 2}vw`,
        marginTop: `${-height / 2}vh`,
        x,
        y,
        scale,
      }}
    >
      <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
      {children}
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
            // the centre tile is drawn full screen; the rest leave the screen, so 2× is enough
            <Tile key={i} src={srcs[i]} tile={tile} drawScale={i === 0 ? tile.scaleTo : 2} progress={scrollYProgress}>
              {i === 0 && (title || eyebrow) && (
                <motion.div
                  style={{ opacity: labelOpacity }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-center text-white"
                >
                  {eyebrow && <p className="text-[5.6vh] uppercase tracking-[0.3em] text-white/80">{eyebrow}</p>}
                  {title && <p className="text-[13.6vh] font-semibold leading-tight tracking-tight">{title}</p>}
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
