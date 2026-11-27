import * as React from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface MorphingArrowButtonProps {
  direction: "left" | "right"
  onClick?: () => void
  /** accessible name, e.g. "Previous photo" */
  label: string
  /** circle diameter in px; the hover pill is ~1.9x as wide */
  size?: number
  className?: string
}

/**
 * Round arrow button that stretches into a pill on hover or keyboard focus.
 * Adapted from a "morphing arrow button" snippet. The left button is anchored
 * at its left edge and grows to the right, the right button the opposite way,
 * so both grow toward the middle of whatever they sit on.
 */
export function MorphingArrowButton({ direction, onClick, label, size = 48, className }: MorphingArrowButtonProps) {
  const [open, setOpen] = React.useState(false)
  const isLeft = direction === "left"
  const Icon = isLeft ? ChevronLeft : ChevronRight
  const wide = Math.round(size * 1.9)
  const state = open ? "hover" : "initial"

  return (
    // fixed-width slot so the layout doesn't move while the pill grows
    <div className={cn("flex", isLeft ? "justify-start" : "justify-end", className)} style={{ width: wide, height: size }}>
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onFocus={(e) => setOpen(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setOpen(false)}
        // swipe handling on the photo shouldn't treat a button press as a drag
        onPointerDown={(e) => e.stopPropagation()}
        className="relative flex cursor-pointer items-center justify-center overflow-hidden border border-white/70 bg-black/30 text-white outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white/70"
        style={{ height: size }}
        variants={{
          initial: { width: size, borderRadius: size / 2 },
          hover: {
            width: wide,
            borderRadius: isLeft ? `${size / 2}px 14px 14px ${size / 2}px` : `14px ${size / 2}px ${size / 2}px 14px`,
          },
        }}
        initial="initial"
        animate={state}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <span className="relative h-full w-full">
          <motion.span
            className={cn("absolute top-1/2 h-0.5 -translate-y-1/2 bg-white", isLeft ? "right-4" : "left-4")}
            variants={{ initial: { width: 0 }, hover: { width: "calc(100% - 44px)" } }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-y-1/2"
            variants={{ initial: { x: "-50%" }, hover: { x: isLeft ? "-120%" : "20%" } }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Icon className="h-6 w-6" />
          </motion.span>
        </span>
      </motion.button>
    </div>
  )
}

export default MorphingArrowButton
