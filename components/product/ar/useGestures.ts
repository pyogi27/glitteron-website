'use client'
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { gesturePose, type Point, type Pose } from '@/lib/ar/gestures'

interface Base {
  pose: Pose
  ids: number[]
  from: Point[]
  width: number
  height: number
}

/**
 * Drag, pinch and twist on the stage via Pointer Events. Spread `handlers` on an element
 * with `touch-action: none`, always: while `enabled` is false no gesture starts, but
 * lifts are still seen, so no finger is left behind in the map. The first two pointers
 * count; a third is ignored. Every time a finger lands or lifts, the gesture re-bases on
 * the current pose, so going from one finger to two never makes the light jump.
 */
export function useGestures(initial: Pose, enabled: boolean, onGesture?: () => void) {
  const [pose, setPoseState] = useState(initial)
  const poseRef = useRef(initial)
  const pointers = useRef(new Map<number, Point>())
  const base = useRef<Base | null>(null)

  const setPose = useCallback((next: Pose) => {
    poseRef.current = next
    setPoseState(next)
  }, [])

  const rebase = (el: Element) => {
    const ids = [...pointers.current.keys()].slice(0, 2)
    const { width, height } = el.getBoundingClientRect()
    base.current = ids.length
      ? { pose: poseRef.current, ids, from: ids.map(id => pointers.current.get(id)!), width, height }
      : null
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    rebase(e.currentTarget)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const b = base.current
    if (!enabled || !b || !b.ids.includes(e.pointerId)) return
    const to = b.ids.map(id => pointers.current.get(id)!)
    setPose(gesturePose(b.pose, b.from, to, b.width, b.height))
    onGesture?.()
  }

  const onPointerEnd = (e: PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    rebase(e.currentTarget)
  }

  return {
    pose,
    setPose,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onLostPointerCapture: onPointerEnd,
    },
  }
}
