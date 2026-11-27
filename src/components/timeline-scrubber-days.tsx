import * as React from "react"
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react"
import { clsx, type ClassValue } from "clsx"
import MorphingArrowButton from "./morphing-arrow-button"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ---------- odometer with sign ---------- */

function Reel({ digit, lh }: { digit: number; lh: number }) {
  return (
    <span className="inline-block overflow-hidden align-top" style={{ height: lh }}>
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: -digit * lh }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {Array.from({ length: 10 }).map((_, d) => (
          <span key={d} className="block text-center" style={{ height: lh, lineHeight: `${lh}px` }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

function Odometer({ value, size, suffix }: { value: number; size: number; suffix?: string }) {
  const lh = Math.round(size * 1.1)
  const chars = String(Math.abs(value)).split("")
  return (
    <span
      className="inline-flex items-start tabular-nums"
      style={{ fontSize: size, height: lh, lineHeight: `${lh}px` }} role="img"
      aria-label={`${value}${suffix ?? ""}`}
    >
      <span aria-hidden className="inline-flex select-none">
        <motion.span
          className="inline-block overflow-hidden"
          style={{ height: lh }}
          initial={false}
          animate={{ width: value < 0 ? "0.6em" : "0em", opacity: value < 0 ? 1 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          −
        </motion.span>
        {chars.map((c, i) => (
          <Reel key={chars.length - i} digit={Number(c)} lh={lh} />
        ))}
        {suffix && <span>{suffix}</span>}
      </span>
    </span>
  )
}

/* ---------- scrubber ---------- */

export interface TimelinePhoto {
  src: string
  /** tiny pre-blurred copy for backgrounds; without it `src` is blurred with CSS */
  backdrop?: string
  title: string
}

export interface TimelineStop {
  /** day of the month, 1-based (1 to the last day of the month) */
  day: number
  /** one or more photos for that day, in display order */
  photos: TimelinePhoto[]
  /** optional number shown as an odometer, e.g. temperature. Omit to hide it. */
  value?: number
  valueSuffix?: string
  valueLabel?: string
}

export interface TimelineScrubberProps {
  stops: TimelineStop[]
  /** full year, e.g. 2026 */
  year: number
  /** 0 to 11, month of the year (JS convention: 0 = January) */
  month: number
  heading?: string
  className?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/**
 * The whole photo, uncropped, centred in the frame. Any space it leaves (a
 * portrait or 4:3 photo in the wide frame) is filled with a blurred, enlarged
 * copy of the same photo instead of bars.
 */
function WholePhoto({ src, backdrop, alt }: { src: string; backdrop?: string; alt: string }) {
  return (
    <>
      <img
        src={backdrop ?? src}
        alt=""
        aria-hidden
        className={cn("absolute inset-0 h-full w-full scale-110 object-cover brightness-75", !backdrop && "blur-2xl")}
      />
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain" />
    </>
  )
}

export function TimelineScrubber({ stops, year, month, heading, className }: TimelineScrubberProps) {
  // day 0 of next month = last day of this month (handles leap years)
  const daysInMonth = React.useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])
  const monthName = MONTH_NAMES[month]
  const title = heading ?? `${monthName} ${year}`

  const track = React.useRef<HTMLDivElement>(null)
  // `stop` is the day being shown; `photo` is which of that day's photos
  const [shown, setShown] = React.useState({ stop: 0, photo: 0 })
  const [dir, setDir] = React.useState<1 | -1>(1)
  // the previous picture stays underneath while the new one wipes in
  const [base, setBase] = React.useState({ stop: 0, photo: 0 })
  const shownRef = React.useRef(shown)
  const handleX = useMotionValue(0)
  const dragging = React.useRef(false)

  // 0..1 position along the track for a 1-based day
  const pos = (day: number) => (day - 1) / (daysInMonth - 1)

  const show = React.useCallback((stop: number, photo: number) => {
    const prev = shownRef.current
    if (stop === prev.stop && photo === prev.photo) return
    setDir(stop > prev.stop || (stop === prev.stop && photo > prev.photo) ? 1 : -1)
    setBase(prev)
    const next = { stop, photo }
    shownRef.current = next
    setShown(next)
  }, [])

  const setStop = React.useCallback(
    (i: number, snap = true) => {
      if (i !== shownRef.current.stop) show(i, 0)
      const w = track.current?.clientWidth ?? 0
      if (snap) animate(handleX, pos(stops[i].day) * w, { duration: 0.7, ease: [0.42, 0, 0, 1] })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleX, stops, daysInMonth, show],
  )

  // flip through the current day's photos
  const stepPhoto = (delta: number) => {
    const { stop: s, photo } = shownRef.current
    const next = photo + delta
    if (next >= 0 && next < stops[s].photos.length) show(s, next)
  }

  // place handle on mount, resize, and when the month length changes
  React.useEffect(() => {
    const place = () => {
      const w = track.current?.clientWidth ?? 0
      handleX.set(pos(stops[shownRef.current.stop].day) * w)
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysInMonth])

  const nearest = (ratio: number) => {
    let best = 0
    stops.forEach((s, i) => {
      if (Math.abs(pos(s.day) - ratio) < Math.abs(pos(stops[best].day) - ratio)) best = i
    })
    return best
  }

  const fromPointer = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - r.left, 0), r.width)
    handleX.set(x)
    const i = nearest(x / r.width)
    if (i !== shownRef.current.stop) setStop(i, false)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    fromPointer(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => dragging.current && fromPointer(e.clientX)
  const onPointerUp = () => {
    dragging.current = false
    setStop(shownRef.current.stop)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = shownRef.current.stop
    if (e.key === "ArrowRight") setStop(Math.min(cur + 1, stops.length - 1))
    if (e.key === "ArrowLeft") setStop(Math.max(cur - 1, 0))
    if (e.key === "ArrowDown") stepPhoto(1)
    if (e.key === "ArrowUp") stepPhoto(-1)
    if (e.key === "Home") setStop(0)
    if (e.key === "End") setStop(stops.length - 1)
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) e.preventDefault()
  }

  // swipe the photo left/right to flip through the day's photos
  const swipe = React.useRef<{ x: number; y: number } | null>(null)
  const onImageDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onImageUp = (e: React.PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) stepPhoto(dx < 0 ? 1 : -1)
  }

  const active = shown.stop
  const stop = stops[active]
  const photoCount = stop.photos.length
  const photo = stop.photos[shown.photo]
  const basePhoto = stops[base.stop].photos[base.photo]
  const hasPrev = shown.photo > 0
  const hasNext = shown.photo < photoCount - 1

  // stop days whose label would collide with the previous visible label on small screens
  const crowdedStops = React.useMemo(() => {
    const MIN_GAP = 3
    const hidden = new Set<number>()
    let lastShown = -Infinity
    for (const s of stops) {
      if (s.day - lastShown < MIN_GAP && s.day !== stop.day) hidden.add(s.day)
      else lastShown = s.day
    }
    return hidden
  }, [stops, stop.day])

  return (
    <div className={cn("w-full rounded-[12px] border border-black/[0.08] bg-white p-4 md:p-6", className)}>
      {/* image */}
      <div
        className="relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden rounded-[10px] bg-neutral-200 sm:aspect-[16/9] md:aspect-[16/7]"
        onPointerDown={onImageDown}
        onPointerUp={onImageUp}
      >
        {stops.flatMap((s) => s.photos).map((p) => (
          <link key={p.src} rel="preload" as="image" href={p.src} />
        ))}
        {(base.stop !== shown.stop || base.photo !== shown.photo) && (
          <div key={`base-${basePhoto.src}`} aria-hidden className="absolute inset-0">
            <WholePhoto src={basePhoto.src} backdrop={basePhoto.backdrop} alt="" />
          </div>
        )}
        <motion.div
          key={photo.src}
          className="absolute inset-0"
          initial={{ clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.06 }}
          animate={{ clipPath: "inset(0 0 0 0%)", scale: 1 }}
          transition={{ duration: 0.9, ease: [0.42, 0, 0, 1] }}
          onAnimationComplete={() => setBase(shownRef.current)}
        >
          <WholePhoto src={photo.src} backdrop={photo.backdrop} alt={photo.title} />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/45 via-transparent to-black/20" />

        <div className="absolute left-5 top-5 z-[3] md:left-7 md:top-6">
          {/* a pill so it reads cleanly whether it lands on the photo, the blurred fill, or the seam between them */}
          <p className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[14px] text-white/90 backdrop-blur-md">{title}</p>
        </div>

        {photoCount > 1 && (
          <>
            <p
              className="absolute right-5 top-5 z-[3] rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[14px] tabular-nums text-white/90 backdrop-blur-md md:right-7 md:top-6"
              aria-live="polite"
            >
              {shown.photo + 1} / {photoCount}
            </p>
            {/* back / forward through this day's photos */}
            <MorphingArrowButton
              direction="left"
              label="Previous photo"
              size={44}
              onClick={() => stepPhoto(-1)}
              className={cn("absolute left-3 top-1/2 z-[3] -translate-y-1/2 transition-opacity duration-300 md:left-5", !hasPrev && "pointer-events-none opacity-0")}
            />
            <MorphingArrowButton
              direction="right"
              label="Next photo"
              size={44}
              onClick={() => stepPhoto(1)}
              className={cn("absolute right-3 top-1/2 z-[3] -translate-y-1/2 transition-opacity duration-300 md:right-5", !hasNext && "pointer-events-none opacity-0")}
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-5 bottom-5 z-[3] flex items-end justify-between gap-6 md:inset-x-7 md:bottom-6">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={photo.src}
                className="text-[clamp(26px,3vw,44px)] font-normal leading-[1.05] tracking-[-0.03em] text-white"
                initial={{ y: "105%" }}
                animate={{ y: "0%", transition: { duration: 0.7, ease: [0.42, 0, 0, 1], delay: 0.15 } }}
                exit={{ y: "-105%", transition: { duration: 0.3, ease: [0.42, 0, 1, 1] } }}
              >
                {photo.title}
              </motion.h3>
            </AnimatePresence>
          </div>
          {stop.value !== undefined && (
            <div className="text-right text-white">
              <span className="hidden md:inline"><Odometer value={stop.value} size={44} suffix={stop.valueSuffix} /></span>
              <span className="md:hidden"><Odometer value={stop.value} size={32} suffix={stop.valueSuffix} /></span>
              {stop.valueLabel && <p className="mt-1 text-[13px] text-white/75">{stop.valueLabel}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ruler */}
      <div className="px-2 pb-2 pt-7 md:px-4">
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={stops.length - 1}
          aria-valuenow={active}
          aria-valuetext={`${monthName} ${stop.day}: ${photo.title}${photoCount > 1 ? `, photo ${shown.photo + 1} of ${photoCount}` : ""}`}
          aria-keyshortcuts="ArrowUp ArrowDown"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative h-14 cursor-ew-resize touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-[6px]"
        >
          {/* ticks: one per day, major on day 1 and every 5th day */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const major = day === 1 || day % 5 === 0
            return (
              <span
                key={day}
                className={cn("absolute top-0 w-px -translate-x-1/2", major ? "h-4 bg-black/35" : "h-2.5 bg-black/15")}
                style={{ left: `${pos(day) * 100}%` }}
              />
            )
          })}
          {/* day labels: stops always, every 5th day (and day 1) on md+.
              On small screens a stop label within MIN_GAP days of the previous
              visible one is hidden (unless active) so neighbours don't overlap. */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isStop = stops.some((s) => s.day === day)
            const isActive = stop.day === day
            const isMajor = day === 1 || day % 5 === 0
            if (!isStop && !isMajor) return null
            const crowded = isStop && !isActive && crowdedStops.has(day)
            return (
              <span
                key={day}
                className={cn(
                  "absolute top-6 -translate-x-1/2 text-[13px] tabular-nums transition-colors duration-500",
                  isActive ? "z-[1] bg-white px-0.5 text-black" : isStop ? "text-black/55" : "hidden text-black/25 md:block",
                  crowded && "hidden md:block",
                )}
                style={{ left: `${pos(day) * 100}%` }}
              >
                {day}
              </span>
            )
          })}
          {/* days with several photos get a dot per photo under the day number (max 5) */}
          {stops.map((s) => {
            if (s.photos.length < 2) return null
            const isActive = s.day === stop.day
            const crowded = !isActive && crowdedStops.has(s.day)
            const dots = Math.min(s.photos.length, 5)
            return (
              <span
                key={s.day}
                aria-hidden
                className={cn("absolute top-[46px] flex -translate-x-1/2 gap-[3px]", crowded && "hidden md:flex")}
                style={{ left: `${pos(s.day) * 100}%` }}
              >
                {Array.from({ length: dots }).map((_, d) => (
                  <span
                    key={d}
                    className={cn(
                      "h-1 w-1 rounded-full transition-colors duration-300",
                      isActive && d === Math.min(shown.photo, dots - 1) ? "bg-black" : isActive ? "bg-black/40" : "bg-black/30",
                    )}
                  />
                ))}
              </span>
            )
          })}
          {/* handle */}
          <motion.span className="pointer-events-none absolute -top-2 left-0 ml-[-1.5px] h-7 w-[3px] rounded-full bg-black" style={{ x: handleX }} />
        </div>
      </div>
    </div>
  )
}

export default TimelineScrubber
