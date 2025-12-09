import { RefCallback, useCallback, useEffect, useRef, useState } from 'react'

type HighlightState = { width: number; left: number } | null

type SlidingHighlightHook = {
  highlight: HighlightState
  containerRef: RefCallback<HTMLDivElement>
  registerItem: (key: string) => (node: HTMLElement | null) => void
}

export function useSlidingHighlight(activeKey: string | null): SlidingHighlightHook {
  const containerNodeRef = useRef<HTMLDivElement | null>(null)
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null)
  const activeKeyRef = useRef<string | null>(activeKey)
  const frameRef = useRef<number | null>(null)
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const refCallbacks = useRef<Record<string, (node: HTMLElement | null) => void>>({})
  const [highlight, setHighlight] = useState<HighlightState>(null)

  const measure = useCallback(() => {
    const key = activeKeyRef.current
    const container = containerNodeRef.current
    if (!key || !container) {
      setHighlight(null)
      return
    }
    const target = refs.current[key]
    if (!target) {
      setHighlight(null)
      return
    }
    const rect = target.getBoundingClientRect()
    const parentRect = container.getBoundingClientRect()
    setHighlight({
      width: rect.width,
      left: rect.left - parentRect.left,
    })
  }, [])

  const schedule = useCallback(() => {
    if (typeof window === 'undefined') return
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }
    frameRef.current = window.requestAnimationFrame(() => {
      measure()
      frameRef.current = null
    })
  }, [measure])

  const containerRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    containerNodeRef.current = node
    setContainerNode(node)
    schedule()
  }, [schedule])

  const registerItem = useCallback((key: string) => {
    if (!refCallbacks.current[key]) {
      refCallbacks.current[key] = (node: HTMLElement | null) => {
        refs.current[key] = node
        schedule()
      }
    }
    return refCallbacks.current[key]
  }, [schedule])

  useEffect(() => {
    activeKeyRef.current = activeKey
    schedule()
  }, [activeKey, schedule])

  useEffect(() => () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => schedule()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [schedule])

  useEffect(() => {
    if (!containerNode || typeof ResizeObserver === 'undefined') return
    const resizeObserver = new ResizeObserver(() => schedule())
    resizeObserver.observe(containerNode)
    return () => resizeObserver.disconnect()
  }, [containerNode, schedule])

  useEffect(() => {
    if (!containerNode || typeof MutationObserver === 'undefined') return
    const mutationObserver = new MutationObserver(() => schedule())
    mutationObserver.observe(containerNode, { childList: true, subtree: true, characterData: true })
    return () => mutationObserver.disconnect()
  }, [containerNode, schedule])

  return { highlight, containerRef, registerItem }
}
