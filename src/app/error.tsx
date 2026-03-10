'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-red-500 mb-4">500</p>
        <h1 className="text-2xl font-bold text-brand-text mb-3">Something went wrong</h1>
        <p className="text-brand-muted mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try again or contact us if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-brand-blue/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-brand-border text-brand-text text-sm font-semibold rounded-xl hover:bg-brand-arctic transition-colors"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-brand-muted mt-6 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
