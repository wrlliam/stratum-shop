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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?callbackUrl=/account')
    }
    if (session?.user) {
      setName(session.user.name || '')
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
        <h1 className="text-2xl font-bold text-brand-text mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
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

          {/* Quick links */}
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-card">
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
