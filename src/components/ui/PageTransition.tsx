'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [key, setKey] = useState(pathname)

  useEffect(() => {
    setKey(pathname)
  }, [pathname])

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
