// The current phone edge colour, shared between pages and <PhoneEdges>.

import { useLayoutEffect } from "react"

export const WHITE = "#ffffff"
export const BLACK = "#000000"

let requests: { color: string }[] = []
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** Returns a function that withdraws the request. */
export function requestEdgeColor(color: string) {
  const request = { color }
  requests = [...requests, request]
  notify()
  return () => {
    requests = requests.filter((r) => r !== request)
    notify()
  }
}

export const getEdgeColor = () => requests.at(-1)?.color ?? WHITE

export function subscribeEdgeColor(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** While mounted with a colour, asks for that edge colour. The latest request wins. */
export function usePhoneEdges(color: string | null) {
  useLayoutEffect(() => (color ? requestEdgeColor(color) : undefined), [color])
}
