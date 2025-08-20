import { prisma } from '@/lib/prisma'
import { ReconciliationKind } from '@prisma/client'

export interface BudgetUtilization {
  budgetId: string
  totalAllocated: number
  totalActual: number
  utilizationPercentage: number
  lineItems: LineItemUtilization[]
}

export interface LineItemUtilization {
  id: string
  name: string
  category: string
  allocated: number
  actualGross: number
  actualNet: number // after write-offs
  variance: number
  utilizationPercentage: number
  writeoffs: number
}

export async function getBudgetUtilization(budgetId: string): Promise<BudgetUtilization> {
  const budget = await prisma.budget.findUniqueOrThrow({
    where: { id: budgetId },
    include: {
      lineItems: {
        include: {
          reconciliationLedger: true,
        },
      },
    },
  })

  const lineItems: LineItemUtilization[] = budget.lineItems.map((lineItem) => {
    const reconciliations = lineItem.reconciliationLedger

    // Calculate gross actuals (time + expenses)
    const actualGross = reconciliations
      .filter(r => r.kind === ReconciliationKind.TIME || r.kind === ReconciliationKind.EXPENSE)
      .reduce((sum, r) => sum + r.amountMinor, 0)

    // Calculate write-offs
    const writeoffs = reconciliations
      .filter(r => r.kind === ReconciliationKind.WRITEOFF)
      .reduce((sum, r) => sum + Math.abs(r.amountMinor), 0)

    // Net actual = gross - write-offs
    const actualNet = actualGross - writeoffs

    const variance = actualNet - lineItem.allocatedAmount
    const utilizationPercentage = lineItem.allocatedAmount > 0 
      ? Math.round((actualNet / lineItem.allocatedAmount) * 100)
      : 0

    return {
      id: lineItem.id,
      name: lineItem.name,
      category: lineItem.category,
      allocated: lineItem.allocatedAmount,
      actualGross,
      actualNet,
      variance,
      utilizationPercentage,
      writeoffs,
    }
  })

  const totalAllocated = budget.totalAmount
  const totalActual = lineItems.reduce((sum, item) => sum + item.actualNet, 0)
  const utilizationPercentage = totalAllocated > 0 
    ? Math.round((totalActual / totalAllocated) * 100)
    : 0

  return {
    budgetId: budget.id,
    totalAllocated,
    totalActual,
    utilizationPercentage,
    lineItems,
  }
}

export async function checkBudgetAlerts(budgetId: string, userId: string) {
  const budget = await prisma.budget.findUniqueOrThrow({
    where: { id: budgetId },
  })

  const utilization = await getBudgetUtilization(budgetId)
  const thresholds = budget.alertThresholds as number[]

  // Check each threshold
  for (const threshold of thresholds) {
    const thresholdPercentage = threshold * 100

    if (utilization.utilizationPercentage >= thresholdPercentage) {
      // Check if alert already exists for this threshold
      const existingAlert = await prisma.alert.findFirst({
        where: {
          scope: 'BUDGET',
          refId: budgetId,
          level: threshold,
          resolvedAt: null,
        },
      })

      if (!existingAlert) {
        // Create new alert
        await prisma.alert.create({
          data: {
            scope: 'BUDGET',
            refId: budgetId,
            type: utilization.utilizationPercentage > 100 ? 'EXCEEDED' : 'THRESHOLD_REACHED',
            level: threshold,
          },
        })

        // TODO: Send email notification
        console.log(`🚨 Budget alert: ${utilization.utilizationPercentage}% utilization reached threshold ${thresholdPercentage}%`)
      }
    }
  }

  // Check line item alerts
  for (const lineItem of utilization.lineItems) {
    for (const threshold of thresholds) {
      const thresholdPercentage = threshold * 100

      if (lineItem.utilizationPercentage >= thresholdPercentage) {
        const existingAlert = await prisma.alert.findFirst({
          where: {
            scope: 'LINE_ITEM',
            refId: lineItem.id,
            level: threshold,
            resolvedAt: null,
          },
        })

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              scope: 'LINE_ITEM',
              refId: lineItem.id,
              type: lineItem.utilizationPercentage > 100 ? 'EXCEEDED' : 'THRESHOLD_REACHED',
              level: threshold,
            },
          })

          console.log(`🚨 Line item alert: ${lineItem.name} at ${lineItem.utilizationPercentage}% utilization`)
        }
      }
    }
  }
}