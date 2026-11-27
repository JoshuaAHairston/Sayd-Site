// Source: 21st.dev "Parallax Floating" (fancy components).
// Changes: element ids use React's useId instead of Math.random(); `cn` and
// `useMousePositionRef` are inlined (the original imported them
// from `@/lib/utils` and `@/hooks/...`), and the effect deps include `context`.

import { createContext, useCallback, useContext, useEffect, useId, useRef, type ReactNode, type RefObject } from "react"
import { useAnimationFrame } from "motion/react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Pointer position relative to the container's top-left, kept in a ref (no re-renders). */
function useMousePositionRef(containerRef: RefObject<HTMLElement | null>) {
  const positionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const update = (x: number, y: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      positionRef.current = rect ? { x: x - rect.left, y: y - rect.top } : { x, y }
    }
    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) update(t.clientX, t.clientY)
    }
    window.addEventListener("mousemove", onMouse)
    window.addEventListener("touchmove", onTouch, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMouse)
      window.removeEventListener("touchmove", onTouch)
    }
  }, [containerRef])

  return positionRef
}

interface FloatingContextType {
  registerElement: (id: string, element: HTMLDivElement, depth: number) => void
  unregisterElement: (id: string) => void
}

const FloatingContext = createContext<FloatingContextType | null>(null)

interface FloatingProps {
  children: ReactNode
  className?: string
  sensitivity?: number
  easingFactor?: number
}

const Floating = ({ children, className, sensitivity = 1, easingFactor = 0.05 }: FloatingProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementsMap = useRef(
    new Map<string, { element: HTMLDivElement; depth: number; currentPosition: { x: number; y: number } }>(),
  )
  const mousePositionRef = useMousePositionRef(containerRef)

  const registerElement = useCallback((id: string, element: HTMLDivElement, depth: number) => {
    elementsMap.current.set(id, { element, depth, currentPosition: { x: 0, y: 0 } })
  }, [])

  const unregisterElement = useCallback((id: string) => {
    elementsMap.current.delete(id)
  }, [])

  useAnimationFrame(() => {
    if (!containerRef.current) return
    elementsMap.current.forEach((data) => {
      const strength = (data.depth * sensitivity) / 20
      const dx = mousePositionRef.current.x * strength - data.currentPosition.x
      const dy = mousePositionRef.current.y * strength - data.currentPosition.y
      data.currentPosition.x += dx * easingFactor
      data.currentPosition.y += dy * easingFactor
      data.element.style.transform = `translate3d(${data.currentPosition.x}px, ${data.currentPosition.y}px, 0)`
    })
  })

  return (
    <FloatingContext.Provider value={{ registerElement, unregisterElement }}>
      <div ref={containerRef} className={cn("absolute top-0 left-0 h-full w-full", className)}>
        {children}
      </div>
    </FloatingContext.Provider>
  )
}

export default Floating

interface FloatingElementProps {
  children: ReactNode
  className?: string
  depth?: number
}

export const FloatingElement = ({ children, className, depth = 1 }: FloatingElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const context = useContext(FloatingContext)

  useEffect(() => {
    if (!elementRef.current || !context) return
    context.registerElement(id, elementRef.current, depth ?? 0.01)
    return () => context.unregisterElement(id)
  }, [depth, context, id])

  return (
    <div ref={elementRef} className={cn("absolute will-change-transform", className)}>
      {children}
    </div>
  )
}
