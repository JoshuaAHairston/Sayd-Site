// The current phone edge colour, shared between pages and <PhoneEdges>.

import { useLayoutEffect } from "react"

export const WHITE = "#ffffff"
export const BLACK = "#000000"

/** How to get to a colour; without `duration` (seconds) the change is immediate. */
export type EdgeTransition = { duration?: number; ease?: "linear" | "easeInOut" }
export type EdgeRequest = EdgeTransition & { color: string }

const DEFAULT_REQUEST: EdgeRequest = { color: WHITE }
let requests: EdgeRequest[] = []
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** Returns a function that withdraws the request. */
export function requestEdgeColor(request: EdgeRequest) {
  requests = [...requests, request]
  notify()
  return () => {
    requests = requests.filter((r) => r !== request)
    notify()
  }
}

export const getEdgeRequest = () => requests.at(-1) ?? DEFAULT_REQUEST

export function subscribeEdgeColor(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** While mounted with a colour, asks for that edge colour. The latest request wins. */
export function usePhoneEdges(color: string | null, { duration, ease }: EdgeTransition = {}) {
  useLayoutEffect(
    () => (color ? requestEdgeColor({ color, duration, ease }) : undefined),
    [color, duration, ease],
  )
}
