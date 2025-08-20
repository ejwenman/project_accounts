'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
// import { ProjectsTable } from '@/components/projects/projects-table'
// import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  // Mock data since Prisma is disabled
  const mockProjects = []
  const mockArtists = []

  const canCreateProject = ['ADMIN', 'MANAGER'].includes(session.user.role)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and budgets (Demo Mode - Database Disabled)
          </p>
        </div>
        {canCreateProject && (
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Project (Demo)
          </Button>
        )}
      </div>

      <div className="border rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Demo Mode</h3>
        <p className="text-muted-foreground">
          Projects functionality is temporarily disabled in Bolt.new due to database limitations.
          In a real deployment, you would see your projects table here.
        </p>
      </div>
    </div>
  )
}