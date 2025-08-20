import { prisma } from '@/lib/prisma'
import { ProjectMode, RecoupmentScope, RecoupmentEntryType } from '@prisma/client'

export interface RecoupmentCalculation {
  artistId: string
  projectId?: string
  scope: RecoupmentScope
  openingBalance: number
  income: number
  expenses: number
  timeCharges: number
  writeoffs: number
  netAmount: number
  artistShare: number
  labelShare: number
  closingBalance: number
}

export async function calculateStandaloneRecoupment(projectId: string, artistId: string): Promise<RecoupmentCalculation> {
  // Get all income for the project
  const incomeRecords = await prisma.income.findMany({
    where: { projectId },
  })

  const totalIncome = incomeRecords.reduce((sum, income) => sum + income.amountMinor, 0)

  // Get all reconciled costs (time + expenses - writeoffs)
  const reconciliations = await prisma.reconciliationLedger.findMany({
    where: { projectId },
  })

  const timeCharges = reconciliations
    .filter(r => r.kind === 'TIME')
    .reduce((sum, r) => sum + r.amountMinor, 0)

  const expenses = reconciliations
    .filter(r => r.kind === 'EXPENSE')
    .reduce((sum, r) => sum + r.amountMinor, 0)

  const writeoffs = reconciliations
    .filter(r => r.kind === 'WRITEOFF')
    .reduce((sum, r) => sum + Math.abs(r.amountMinor), 0)

  // Get opening balance from recoupment ledger
  const openingBalance = await getProjectBalance(projectId, artistId)

  // Net = Income - (Time + Expenses - Writeoffs)
  const totalCosts = timeCharges + expenses - writeoffs
  const netAmount = totalIncome - totalCosts

  // For standalone projects, if net > 0, split profit (default 50/50)
  let artistShare = 0
  let labelShare = 0

  if (netAmount > 0) {
    artistShare = Math.round(netAmount * 0.5) // 50% to artist
    labelShare = netAmount - artistShare // remainder to label
  } else {
    // If loss, add to artist's recoupable balance
    artistShare = netAmount // negative amount
  }

  const closingBalance = openingBalance + artistShare

  return {
    artistId,
    projectId,
    scope: RecoupmentScope.PROJECT,
    openingBalance,
    income: totalIncome,
    expenses,
    timeCharges,
    writeoffs,
    netAmount,
    artistShare,
    labelShare,
    closingBalance,
  }
}

export async function calculateMainTabRecoupment(projectId: string, artistId: string): Promise<RecoupmentCalculation> {
  // Get all income for the project
  const incomeRecords = await prisma.income.findMany({
    where: { projectId },
  })

  const totalIncome = incomeRecords.reduce((sum, income) => sum + income.amountMinor, 0)

  // Get all reconciled costs
  const reconciliations = await prisma.reconciliationLedger.findMany({
    where: { projectId },
  })

  const timeCharges = reconciliations
    .filter(r => r.kind === 'TIME')
    .reduce((sum, r) => sum + r.amountMinor, 0)

  const expenses = reconciliations
    .filter(r => r.kind === 'EXPENSE')
    .reduce((sum, r) => sum + r.amountMinor, 0)

  const writeoffs = reconciliations
    .filter(r => r.kind === 'WRITEOFF')
    .reduce((sum, r) => sum + Math.abs(r.amountMinor), 0)

  // Get main tab opening balance
  const openingBalance = await getMainTabBalance(artistId)

  // For main tab: Artist gets 50% of gross income immediately
  const artistImmediateShare = Math.round(totalIncome * 0.5)
  const labelIncomeShare = totalIncome - artistImmediateShare

  // Add costs to main tab balance
  const totalCosts = timeCharges + expenses - writeoffs
  
  // Label's income share services the main tab balance first
  const balanceAfterCosts = openingBalance + totalCosts
  const remainingLabelIncome = Math.max(0, labelIncomeShare - Math.max(0, balanceAfterCosts))
  const mainTabReduction = Math.min(Math.max(0, balanceAfterCosts), labelIncomeShare)

  const closingBalance = balanceAfterCosts - mainTabReduction

  return {
    artistId,
    projectId,
    scope: RecoupmentScope.MAIN_TAB,
    openingBalance,
    income: totalIncome,
    expenses,
    timeCharges,
    writeoffs,
    netAmount: totalIncome - totalCosts,
    artistShare: artistImmediateShare,
    labelShare: remainingLabelIncome, // Label profit after servicing main tab
    closingBalance,
  }
}

export async function processRecoupment(calculation: RecoupmentCalculation, userId: string) {
  const entries = []

  // Record expense additions
  if (calculation.expenses > 0) {
    entries.push({
      artistId: calculation.artistId,
      scope: calculation.scope,
      projectId: calculation.projectId,
      entryType: RecoupmentEntryType.EXPENSE_ADD,
      amountMinor: calculation.expenses,
      currency: 'GBP',
      note: 'Expenses added to recoupment',
      calcSnapshot: calculation,
    })
  }

  // Record time charges
  if (calculation.timeCharges > 0) {
    entries.push({
      artistId: calculation.artistId,
      scope: calculation.scope,
      projectId: calculation.projectId,
      entryType: RecoupmentEntryType.TIME_ADD,
      amountMinor: calculation.timeCharges,
      currency: 'GBP',
      note: 'Time charges added to recoupment',
      calcSnapshot: calculation,
    })
  }

  // Record income application
  if (calculation.income > 0) {
    entries.push({
      artistId: calculation.artistId,
      scope: calculation.scope,
      projectId: calculation.projectId,
      entryType: RecoupmentEntryType.INCOME_APPLY,
      amountMinor: -calculation.income, // negative because it reduces the balance
      currency: 'GBP',
      note: 'Income applied to recoupment',
      calcSnapshot: calculation,
    })
  }

  // Record write-off applications
  if (calculation.writeoffs > 0) {
    entries.push({
      artistId: calculation.artistId,
      scope: calculation.scope,
      projectId: calculation.projectId,
      entryType: RecoupmentEntryType.WRITEOFF_APPLY,
      amountMinor: -calculation.writeoffs, // negative because it reduces charges
      currency: 'GBP',
      note: 'Write-offs applied to reduce charges',
      calcSnapshot: calculation,
    })
  }

  // Record profit split (for standalone projects with profit)
  if (calculation.scope === RecoupmentScope.PROJECT && calculation.artistShare > 0) {
    entries.push({
      artistId: calculation.artistId,
      scope: calculation.scope,
      projectId: calculation.projectId,
      entryType: RecoupmentEntryType.PROFIT_SPLIT,
      amountMinor: calculation.artistShare,
      currency: 'GBP',
      note: `Profit split: artist share of net profit`,
      calcSnapshot: calculation,
    })
  }

  // Create all entries in a transaction
  await prisma.$transaction(
    entries.map(entry => prisma.recoupmentLedger.create({ data: entry }))
  )
}

async function getProjectBalance(projectId: string, artistId: string): Promise<number> {
  const entries = await prisma.recoupmentLedger.findMany({
    where: {
      artistId,
      scope: RecoupmentScope.PROJECT,
      projectId,
    },
  })

  return entries.reduce((sum, entry) => sum + entry.amountMinor, 0)
}

async function getMainTabBalance(artistId: string): Promise<number> {
  const entries = await prisma.recoupmentLedger.findMany({
    where: {
      artistId,
      scope: RecoupmentScope.MAIN_TAB,
    },
  })

  return entries.reduce((sum, entry) => sum + entry.amountMinor, 0)
}