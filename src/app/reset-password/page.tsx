'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EyeOpenIcon, EyeNoneIcon } from '@radix-ui/react-icons'
import toast from 'react-hot-toast'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
      return
    }

    setLoading(true)
    try {
      const result = await (authClient as any).resetPassword({ newPassword: password, token })
      if (result.error) {
        toast.error(result.error.message || 'Failed to reset password')
        return
      }
      setDone(true)
      toast.success('Password reset successfully!')
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

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-card-lg">
          <h1 className="text-xl font-bold text-brand-text mb-2">Set new password</h1>
          <p className="text-sm text-brand-muted mb-6">
            Enter your new password below.
          </p>

          {done ? (
            <div className="text-center py-4">
              <p className="text-sm text-green-600 font-medium mb-4">
                Your password has been reset successfully.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-brand-blue-dark transition-colors"
              >
                Sign in with new password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-8 text-brand-muted hover:text-brand-text transition-colors"
                >
                  {showPassword ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
