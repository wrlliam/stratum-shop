'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'

export function ConfettiCelebration() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [active, setActive] = useState(true)

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    // Stop after 5 s
    const timer = setTimeout(() => setActive(false), 5000)
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer) }
  }, [])

  if (!active || !dimensions.width) return null

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={350}
      gravity={0.18}
      colors={['#6CBCE3', '#3A9FD4', '#1a1a2e', '#ffffff', '#4ade80', '#f59e0b']}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  )
}
