'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await (authClient as any).forgetPassword({
        email,
        redirectTo: '/reset-password',
      })
      setSent(true)
      toast.success('Check your email for a reset link')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-brand-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Stratum"
              width={120}
              height={40}
              className="group-hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-card-lg">
          <h1 className="text-xl font-bold text-brand-text mb-2">Reset your password</h1>
          <p className="text-sm text-brand-muted mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-green-600 font-medium mb-4">
                If an account exists with that email, you&apos;ll receive a reset link shortly.
              </p>
              <Link href="/login" className="text-sm text-brand-blue hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-xs text-brand-muted text-center mt-6">
          <Link href="/login" className="hover:text-brand-blue transition-colors">
            &larr; Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
