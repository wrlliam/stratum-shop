'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function PageLoader() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-brand-surface flex items-end"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{}}
          transition={{ duration: 0.65, delay: 0.25, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: 'bottom' }}
        >
          <motion.div
            className="w-full h-px bg-brand-blue"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
