import { PrismaClient, UserRole, ProjectType, ProjectMode, TimesheetSource, ExpenseSource, IncomeSource, ReconciliationKind } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await prisma.$transaction([
    prisma.alert.deleteMany(),
    prisma.recoupmentLedger.deleteMany(),
    prisma.reconciliationLedger.deleteMany(),
    prisma.income.deleteMany(),
    prisma.externalExpense.deleteMany(),
    prisma.timesheetAllocation.deleteMany(),
    prisma.timesheetEntry.deleteMany(),
    prisma.rateCard.deleteMany(),
    prisma.billingRole.deleteMany(),
    prisma.budgetLineItem.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.project.deleteMany(),
    prisma.artist.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@projectaccounts.com',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@projectaccounts.com',
      password: await bcrypt.hash('manager123', 10),
      role: UserRole.MANAGER,
    },
  })

  const artistUser = await prisma.user.create({
    data: {
      name: 'Naomi Artist',
      email: 'naomi@artist.com',
      password: await bcrypt.hash('artist123', 10),
      role: UserRole.ARTIST_VIEW,
    },
  })

  // Create artist
  const naomiArtist = await prisma.artist.create({
    data: {
      name: 'Naomi',
    },
  })

  // Create billing roles
  const standardRole = await prisma.billingRole.create({
    data: {
      name: 'Standard Rate',
      amountPerHour: 5000, // £50/hour in pence
    },
  })

  const assistantRole = await prisma.billingRole.create({
    data: {
      name: 'Assistant Rate',
      amountPerHour: 2500, // £25/hour in pence
    },
  })

  // Create rate cards
  await prisma.rateCard.create({
    data: {
      userId: adminUser.id,
      amountPerHour: 7500, // £75/hour in pence
    },
  })

  await prisma.rateCard.create({
    data: {
      userId: managerUser.id,
      amountPerHour: 5000, // £50/hour in pence
    },
  })

  // Create projects
  const standaloneProject = await prisma.project.create({
    data: {
      code: 'NAOMI_EP_STANDALONE',
      name: 'Naomi EP - Standalone Project',
      artistId: naomiArtist.id,
      type: ProjectType.ARTIST,
      mode: ProjectMode.STANDALONE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
    },
  })

  const mainTabProject = await prisma.project.create({
    data: {
      code: 'NAOMI_MAIN',
      name: 'Naomi Main Tab',
      artistId: naomiArtist.id,
      type: ProjectType.ARTIST,
      mode: ProjectMode.MAIN_TAB,
      startDate: new Date('2024-01-01'),
    },
  })

  // Create budgets
  const standaloneBudget = await prisma.budget.create({
    data: {
      projectId: standaloneProject.id,
      totalAmount: 1000000, // £10,000 in pence
      currency: 'GBP',
    },
  })

  const mainTabBudget = await prisma.budget.create({
    data: {
      projectId: mainTabProject.id,
      totalAmount: 500000, // £5,000 in pence
      currency: 'GBP',
    },
  })

  // Create budget line items for standalone project
  const prLineItem = await prisma.budgetLineItem.create({
    data: {
      budgetId: standaloneBudget.id,
      name: 'PR & Marketing',
      category: 'Marketing',
      allocatedAmount: 300000, // £3,000 in pence
    },
  })

  const socialLineItem = await prisma.budgetLineItem.create({
    data: {
      budgetId: standaloneBudget.id,
      name: 'Social Content',
      category: 'Content',
      allocatedAmount: 200000, // £2,000 in pence
    },
  })

  const epkLineItem = await prisma.budgetLineItem.create({
    data: {
      budgetId: standaloneBudget.id,
      name: 'EPK Production',
      category: 'Production',
      allocatedAmount: 300000, // £3,000 in pence
    },
  })

  const adsLineItem = await prisma.budgetLineItem.create({
    data: {
      budgetId: standaloneBudget.id,
      name: 'Paid Advertising',
      category: 'Advertising',
      allocatedAmount: 200000, // £2,000 in pence
    },
  })

  // Create budget line items for main tab project
  await prisma.budgetLineItem.create({
    data: {
      budgetId: mainTabBudget.id,
      name: 'General Marketing',
      category: 'Marketing',
      allocatedAmount: 250000, // £2,500 in pence
    },
  })

  await prisma.budgetLineItem.create({
    data: {
      budgetId: mainTabBudget.id,
      name: 'Content Creation',
      category: 'Content',
      allocatedAmount: 250000, // £2,500 in pence
    },
  })

  // Create sample timesheet entries
  const timesheet1 = await prisma.timesheetEntry.create({
    data: {
      userId: managerUser.id,
      projectId: standaloneProject.id,
      date: new Date('2024-03-15'),
      description: 'PR strategy development and media outreach',
      hoursDecimal: 4.5,
      source: TimesheetSource.NATIVE,
    },
  })

  const timesheet2 = await prisma.timesheetEntry.create({
    data: {
      userId: adminUser.id,
      projectId: standaloneProject.id,
      date: new Date('2024-03-16'),
      description: 'Social media content planning',
      hoursDecimal: 3.0,
      source: TimesheetSource.NATIVE,
    },
  })

  const timesheet3 = await prisma.timesheetEntry.create({
    data: {
      userId: managerUser.id,
      projectId: standaloneProject.id,
      date: new Date('2024-03-17'),
      description: 'EPK video editing and production',
      hoursDecimal: 6.5,
      source: TimesheetSource.CLOCKIFY_IMPORT,
      externalRef: 'CLK-001-2024',
    },
  })

  // Create sample external expenses
  await prisma.externalExpense.create({
    data: {
      projectId: standaloneProject.id,
      vendor: 'Meta Ads',
      date: new Date('2024-03-10'),
      description: 'Facebook and Instagram advertising campaign',
      amountNetMinor: 80000, // £800 net in pence
      amountVatMinor: 16000, // £160 VAT in pence
      source: ExpenseSource.XERO_IMPORT,
      projectCode: 'NAOMI_EP_STANDALONE',
      artistTag: 'Naomi',
      externalRef: 'XRO-INV-001',
    },
  })

  await prisma.externalExpense.create({
    data: {
      projectId: standaloneProject.id,
      vendor: 'Creative Studio Ltd',
      date: new Date('2024-03-12'),
      description: 'Professional photography for EPK',
      amountNetMinor: 120000, // £1,200 net in pence
      amountVatMinor: 24000, // £240 VAT in pence
      source: ExpenseSource.MANUAL,
      projectCode: 'NAOMI_EP_STANDALONE',
      artistTag: 'Naomi',
    },
  })

  await prisma.externalExpense.create({
    data: {
      projectId: standaloneProject.id,
      vendor: 'PR Agency Co',
      date: new Date('2024-03-14'),
      description: 'Press release distribution and media contacts',
      amountNetMinor: 75000, // £750 net in pence
      amountVatMinor: 15000, // £150 VAT in pence
      source: ExpenseSource.XERO_IMPORT,
      projectCode: 'NAOMI_EP_STANDALONE',
      artistTag: 'Naomi',
      externalRef: 'XRO-INV-002',
    },
  })

  // Create sample income
  await prisma.income.create({
    data: {
      projectId: standaloneProject.id,
      date: new Date('2024-03-20'),
      description: 'Streaming revenue - Spotify',
      amountMinor: 150000, // £1,500 in pence
      source: IncomeSource.XERO_IMPORT,
      projectCode: 'NAOMI_EP_STANDALONE',
      artistTag: 'Naomi',
      externalRef: 'XRO-INC-001',
    },
  })

  await prisma.income.create({
    data: {
      projectId: standaloneProject.id,
      date: new Date('2024-03-22'),
      description: 'Sync licensing deal',
      amountMinor: 500000, // £5,000 in pence
      source: IncomeSource.MANUAL,
      projectCode: 'NAOMI_EP_STANDALONE',
      artistTag: 'Naomi',
    },
  })

  // Create sample reconciliation entries
  await prisma.reconciliationLedger.create({
    data: {
      projectId: standaloneProject.id,
      budgetLineItemId: prLineItem.id,
      kind: ReconciliationKind.TIME,
      refTable: 'TimesheetEntry',
      refId: timesheet1.id,
      hours: 4.5,
      rateUsedMinor: 5000, // £50/hour
      amountMinor: 22500, // £225 in pence
      billingRoleId: standardRole.id,
      createdBy: adminUser.id,
    },
  })

  await prisma.reconciliationLedger.create({
    data: {
      projectId: standaloneProject.id,
      budgetLineItemId: socialLineItem.id,
      kind: ReconciliationKind.TIME,
      refTable: 'TimesheetEntry',
      refId: timesheet2.id,
      hours: 3.0,
      rateUsedMinor: 7500, // £75/hour (admin rate)
      amountMinor: 22500, // £225 in pence
      createdBy: adminUser.id,
    },
  })

  // Create a write-off example
  await prisma.reconciliationLedger.create({
    data: {
      projectId: standaloneProject.id,
      budgetLineItemId: epkLineItem.id,
      kind: ReconciliationKind.WRITEOFF,
      amountMinor: -5000, // £50 write-off (negative amount)
      writeoffReason: 'Client requested discount for early delivery',
      createdBy: adminUser.id,
    },
  })

  // Create timesheet allocations
  await prisma.timesheetAllocation.create({
    data: {
      timesheetId: timesheet1.id,
      budgetLineItemId: prLineItem.id,
      hoursDecimal: 4.5,
    },
  })

  await prisma.timesheetAllocation.create({
    data: {
      timesheetId: timesheet2.id,
      budgetLineItemId: socialLineItem.id,
      hoursDecimal: 3.0,
    },
  })

  await prisma.timesheetAllocation.create({
    data: {
      timesheetId: timesheet3.id,
      budgetLineItemId: epkLineItem.id,
      hoursDecimal: 6.5,
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Created:')
  console.log('- 3 users (admin@projectaccounts.com, manager@projectaccounts.com, naomi@artist.com)')
  console.log('- 1 artist (Naomi)')
  console.log('- 2 projects (Standalone EP, Main Tab)')
  console.log('- 2 budgets with line items')
  console.log('- Sample timesheet entries and expenses')
  console.log('- Sample income and reconciliation data')
  console.log('\n🔑 Login credentials:')
  console.log('Admin: admin@projectaccounts.com / admin123')
  console.log('Manager: manager@projectaccounts.com / manager123')
  console.log('Artist: naomi@artist.com / artist123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })