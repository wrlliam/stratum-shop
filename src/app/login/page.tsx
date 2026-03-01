'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { EyeOpenIcon, EyeNoneIcon } from '@radix-ui/react-icons'
import { signIn, signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email is required'
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signIn.email({
          email: form.email,
          password: form.password,
        })
        if (result.error) {
          toast.error(result.error.message || 'Invalid credentials')
          return
        }
        router.push(callbackUrl)
        router.refresh()
      } else {
        const result = await signUp.email({
          name: form.name,
          email: form.email,
          password: form.password,
        })
        if (result.error) {
          toast.error(result.error.message || 'Registration failed')
          return
        }
        toast.success('Account created! Signing you in…')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-brand-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
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
          <p className="text-xs text-brand-muted mt-3 uppercase tracking-widest font-medium">
            Precision 3D Prints
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-card-lg">
          {/* Toggle */}
          <div className="flex bg-brand-arctic rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-brand-blue shadow-card'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Full Name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                error={errors.name}
                autoComplete="name"
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                error={errors.password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-8 text-brand-muted hover:text-brand-text transition-colors"
              >
                {showPassword ? (
                  <EyeNoneIcon className="w-4 h-4" />
                ) : (
                  <EyeOpenIcon className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="text-right mt-2">
              <Link href="/forgot-password" className="text-xs text-brand-blue hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          )}

          <p className="text-xs text-brand-muted text-center mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
              className="text-brand-blue hover:underline font-medium"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-xs text-brand-muted text-center mt-6">
          <Link href="/" className="hover:text-brand-blue transition-colors">
            ← Back to shop
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
