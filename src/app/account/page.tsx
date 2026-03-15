'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, authClient, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PersonIcon, BackpackIcon, ExitIcon } from '@radix-ui/react-icons'
import toast from 'react-hot-toast'

export default function AccountPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [name, setName] = useState('')
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?callbackUrl=/account')
    }
    if (session?.user) {
      setName(session.user.name || '')
      // @ts-expect-error — custom field
      setMarketingEmails(session.user.marketingEmails ?? true)
    }
  }, [session, isPending, router])

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await authClient.updateUser({ name: name.trim() })
      toast.success('Name updated')
    } catch {
      toast.error('Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-display text-brand-text mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-blue-light border border-brand-blue/30 flex items-center justify-center">
                <PersonIcon className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <p className="font-semibold text-brand-text">{session.user.name}</p>
                <p className="text-sm text-brand-muted">{session.user.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                value={session.user.email}
                disabled
                hint="Email cannot be changed"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Email Preferences */}
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Email Preferences</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-text">Marketing emails</p>
                <p className="text-xs text-brand-muted mt-0.5">Product updates and offers</p>
              </div>
              <button
                onClick={async () => {
                  const next = !marketingEmails
                  setSavingPrefs(true)
                  try {
                    const res = await fetch('/api/account/preferences', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ marketingEmails: next }),
                    })
                    if (!res.ok) throw new Error()
                    setMarketingEmails(next)
                    toast.success(next ? 'Subscribed to marketing emails' : 'Unsubscribed from marketing emails')
                  } catch {
                    toast.error('Failed to update preference')
                  } finally {
                    setSavingPrefs(false)
                  }
                }}
                disabled={savingPrefs}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                  marketingEmails ? 'bg-brand-blue' : 'bg-brand-arctic border border-brand-border'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-brand-surface shadow transition-transform duration-200 ${
                  marketingEmails ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-brand-surface border border-brand-border rounded-sm overflow-hidden shadow-card">
            <Link
              href="/orders"
              className="flex items-center gap-3 px-6 py-4 hover:bg-brand-arctic transition-colors"
            >
              <BackpackIcon className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-medium text-brand-text">My Orders</span>
            </Link>
            <div className="border-t border-brand-border" />
            <Link
              href="/forgot-password"
              className="flex items-center gap-3 px-6 py-4 hover:bg-brand-arctic transition-colors"
            >
              <span className="text-sm font-medium text-brand-text">Change Password</span>
            </Link>
            <div className="border-t border-brand-border" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-red-50 transition-colors"
            >
              <ExitIcon className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
