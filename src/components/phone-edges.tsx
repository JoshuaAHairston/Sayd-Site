// Colours the areas behind a phone's status bar and browser toolbar.
//
// iOS 26 Safari takes those colours from fixed elements touching the top and
// bottom of the screen (falling back to the page background), and doesn't
// reliably notice a background that is only changed through CSS. So this renders
// a thin fixed strip at each edge, inserted afresh whenever the colour changes.
// A CSS transition wouldn't be noticed either, so fades are stepped in JS, one
// new colour per frame, to stay in time with the page. The grey level is stepped
// evenly, the same way a fading overlay blends; motion's own colour mixing
// follows a different curve and visibly trails the page.

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { animate } from "motion/react"
import { getEdgeRequest, subscribeEdgeColor } from "./phone-edge-color"

/** Render once, in Layout. */
export default function PhoneEdges() {
  const target = useSyncExternalStore(subscribeEdgeColor, getEdgeRequest)
  const [level, setLevel] = useState(target.color)
  // where the next fade starts from, even if the last one was interrupted
  const current = useRef(level)
  const color = `rgb(${level}, ${level}, ${level})`

  useEffect(() => {
    const controls = animate(current.current, target.color, {
      duration: target.duration ?? 0,
      ease: target.ease ?? "linear",
      onUpdate: (value) => {
        current.current = value
        setLevel(Math.round(value))
      },
    })
    return () => controls.stop()
  }, [target])

  useEffect(() => {
    document.documentElement.style.backgroundColor = color
    document.body.style.backgroundColor = color
  }, [color])

  return (
    <>
      {["top-0", "bottom-0"].map((edge) => (
        <div
          key={`${edge}-${color}`}
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 ${edge} z-[101] h-1.5`}
          style={{ backgroundColor: color }}
        />
      ))}
    </>
  )
}
