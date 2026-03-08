'use client'

import { motion } from 'motion/react'
import { type ReactNode } from 'react'

interface ScrollReveal3DProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Rotation in degrees on entry — default 14 */
  rotateX?: number
  /** How far the perspective is — default 1200 */
  perspective?: number
}

/**
 * Wraps children in a motion element that "unfolds" from a tilted 3D angle
 * as it scrolls into the viewport. Works on any section or card.
 */
export function ScrollReveal3D({
  children,
  className,
  delay = 0,
  rotateX = 14,
  perspective = 1200,
}: ScrollReveal3DProps) {
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: perspective }}
      initial={{ rotateX, opacity: 0, y: 32, filter: 'blur(6px)' }}
      whileInView={{ rotateX: 0, opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{
        duration: 0.75,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.5, delay },
      }}
    >
      {children}
    </motion.div>
  )
}
