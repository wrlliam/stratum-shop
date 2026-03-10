'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '5rem', fontWeight: 900, color: '#ef4444', margin: '0 0 1rem' }}>500</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 0.75rem' }}>
              Critical error
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}>
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button
              onClick={reset}
              style={{ padding: '0.625rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
