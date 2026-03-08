'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    fetch('/api/account/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => (r.ok ? setStatus('success') : setStatus('error')))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        {status === 'loading' && (
          <div className="animate-spin w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full mx-auto" />
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-brand-text mb-3">Unsubscribed</h1>
            <p className="text-brand-muted text-sm mb-6">
              You&apos;ve been unsubscribed from marketing emails. You&apos;ll still receive important order notifications.
            </p>
            <Link href="/" className="text-sm text-brand-blue hover:underline">
              Back to shop
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">✗</div>
            <h1 className="text-2xl font-bold text-brand-text mb-3">Invalid link</h1>
            <p className="text-brand-muted text-sm mb-6">
              This unsubscribe link is invalid or has expired. You can manage email preferences in your account settings.
            </p>
            <Link href="/account" className="text-sm text-brand-blue hover:underline">
              Account Settings
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
