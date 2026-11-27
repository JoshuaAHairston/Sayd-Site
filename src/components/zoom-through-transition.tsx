// Based on the framecn "Zoom Through Transition". The original wraps the
// animation in @editframe/react's <Timegroup> (a video-composition library that
// only supplied a fixed duration). Here it's plain CSS: same keyframes, easing
// and fade. It plays when `active` turns true and calls `onDone` when finished.

import type { CSSProperties, ReactNode } from "react"

export interface ZoomThroughTransitionProps {
  children: ReactNode
  active: boolean
  onDone?: () => void
  targetScale?: number
  transformOrigin?: string
  /** milliseconds, default 1800 */
  duration?: number
  /** % of the duration after which the content fades out, default 70 */
  fadeStartPercent?: number
  className?: string
  style?: CSSProperties
  /**
   * Classes for a background layer that fades with the content but is NOT
   * scaled. Put solid backgrounds here rather than in `className`: a
   * full-screen fill scaled to 20× is too big for the GPU to draw in one go,
   * so its edges drop out for single frames and whatever is behind flickers through.
   */
  backdropClassName?: string
}

export function ZoomThroughTransition({
  children,
  active,
  onDone,
  targetScale = 20,
  transformOrigin = "center center",
  duration = 1800,
  fadeStartPercent = 70,
  className,
  style,
  backdropClassName,
}: ZoomThroughTransitionProps) {
  const fade = active ? `ztt-opacity ${duration}ms linear forwards` : undefined
  return (
    <>
      <style>{`
        @keyframes ztt-scale { from { transform: scale(1); } to { transform: scale(${targetScale}); } }
        @keyframes ztt-opacity { ${fadeStartPercent}% { opacity: 1; } to { opacity: 0; } }
      `}</style>
      {backdropClassName && <div aria-hidden className={backdropClassName} style={{ animation: fade }} />}
      <div
        className={className}
        style={{
          ...style,
          transformOrigin,
          willChange: active ? "transform, opacity" : undefined,
          animation: active
            ? `ztt-scale ${duration}ms cubic-bezier(0.7, 0, 0.84, 0) forwards, ${fade}`
            : undefined,
        }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && e.animationName === "ztt-scale") onDone?.()
        }}
      >
        {children}
      </div>
    </>
  )
}

export default ZoomThroughTransition
