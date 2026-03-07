'use client'

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface ConfirmOptions {
  message: string
  title?: string
  confirmLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { visible: boolean }) | null>(null)
  const resolveRef = useRef<(val: boolean) => void>(() => {})

  const confirm: ConfirmFn = useCallback((options) => {
    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options
    setState({ ...opts, visible: true })
    return new Promise<boolean>((res) => {
      resolveRef.current = res
    })
  }, [])

  const handleClose = (result: boolean) => {
    resolveRef.current(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state?.visible && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => handleClose(false)}
            />

            {/* Dialog */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-xl border border-brand-border w-full max-w-sm p-6"
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <h2 id="confirm-title" className="text-base font-bold text-brand-text mb-2">
                {state.title ?? 'Are you sure?'}
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed mb-6">{state.message}</p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm font-semibold text-brand-muted border border-brand-border rounded-xl hover:bg-brand-arctic hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                    state.danger
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-brand-blue text-white hover:bg-brand-blue-dark'
                  }`}
                >
                  {state.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}
