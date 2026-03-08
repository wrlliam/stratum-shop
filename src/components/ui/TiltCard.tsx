'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt degrees — default 8 */
  maxTilt?: number
  /** Perspective distance in px — default 900 */
  perspective?: number
}

/**
 * A card that subtly tilts in 3D following the mouse cursor.
 * On mobile (no hover) it renders as a plain div.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
  perspective = 900,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const springConfig = { stiffness: 200, damping: 22 }
  const rotateX = useSpring(useTransform(rawX, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig)
  const rotateY = useSpring(useTransform(rawY, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    rawX.set((e.clientY - rect.top - rect.height / 2) / rect.height)
    rawY.set((e.clientX - rect.left - rect.width / 2) / rect.width)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ transformPerspective: perspective, rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  )
}
