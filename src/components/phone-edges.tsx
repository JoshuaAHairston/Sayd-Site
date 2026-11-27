// Colours the areas behind a phone's status bar and browser toolbar.
//
// iOS 26 Safari takes those colours from fixed elements touching the top and
// bottom of the screen (falling back to the page background), and doesn't
// reliably notice a background that is only changed through CSS. So this renders
// a thin fixed strip at each edge, inserted afresh whenever the colour changes.

import { useEffect, useSyncExternalStore } from "react"
import { WHITE, getEdgeColor, subscribeEdgeColor } from "./phone-edge-color"

/** Render once, in Layout. */
export default function PhoneEdges() {
  const color = useSyncExternalStore(subscribeEdgeColor, getEdgeColor, () => WHITE)

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
