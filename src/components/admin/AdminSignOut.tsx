'use client'

import { ExitIcon } from '@radix-ui/react-icons'
import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export function AdminSignOut() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-brand-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all"
    >
      <ExitIcon className="w-4 h-4" />
      Sign Out
    </button>
  )
}
