'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// import { formatCurrency } from '@/lib/utils/currency'
// import { getBudgetUtilization } from '@/lib/services/budget'
import { AlertTriangle, Clock, DollarSign, TrendingUp, Users } from 'lucide-react'

export default function DashboardPage() {
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

  // Mock data for demo since Prisma is disabled
  const mockStats = {
    projectCount: 5,
    activeProjects: 3,
    totalBudgetAmount: 150000,
    unreconciled: 12,
    recentAlerts: []
  }

  const mockBudgetUtilizations = [
    {
      budgetId: '1',
      project: { name: 'Project Alpha' },
      totalActual: 75000,
      totalAllocated: 100000,
      utilizationPercentage: 75
    },
    {
      budgetId: '2',
      project: { name: 'Project Beta' },
      totalActual: 45000,
      totalAllocated: 50000,
      utilizationPercentage: 90
    }
  ]

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name}. Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.projectCount}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.activeProjects} active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockStats.totalBudgetAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreconciled Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.unreconciled}</div>
            <p className="text-xs text-muted-foreground">
              Timesheet entries pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.recentAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>
              Current spending across active projects (Demo Data)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockBudgetUtilizations.map((budget) => (
              <div key={budget.budgetId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{budget.project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budget.totalActual)} of {formatCurrency(budget.totalAllocated)}
                    </p>
                  </div>
                  <Badge variant={budget.utilizationPercentage > 90 ? 'destructive' : budget.utilizationPercentage > 75 ? 'secondary' : 'default'}>
                    {budget.utilizationPercentage}%
                  </Badge>
                </div>
                <Progress value={Math.min(budget.utilizationPercentage, 100)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Latest budget threshold notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">No active alerts (Demo Mode)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}