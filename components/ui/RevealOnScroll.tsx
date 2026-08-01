'use client'
import { useEffect, useRef, ReactNode, CSSProperties, ElementType } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface RevealOnScrollProps {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
  /** Render as a different element (e.g. 'li', 'article') when the parent requires it. */
  as?: ElementType
}

export default function RevealOnScroll({
  children,
  delay = 0,
  className = '',
  style,
  as: Tag = 'div',
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [delay])

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
