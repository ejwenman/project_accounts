'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Show loading while checking auth
  if (status === 'loading') {
    return <div>Loading...</div>
  }

  // Show nothing while redirecting
  if (!session) {
    return null
  }

  // Show the dashboard content
  return (
    <div>
      <nav>
        <p>Welcome, {session.user?.name}</p>
        {/* Add your navigation here */}
      </nav>
      {children}
    </div>
  )
}