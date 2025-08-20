import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const projectSchema = z.object({
  code: z.string().min(1, 'Project code is required'),
  name: z.string().min(1, 'Project name is required'),
  artistId: z.string().optional(),
  type: z.enum(['ARTIST', 'INTERNAL']),
  mode: z.enum(['STANDALONE', 'MAIN_TAB']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const budgetSchema = z.object({
  projectId: z.string(),
  currency: z.string().default('GBP'),
  totalAmount: z.number().positive('Total amount must be positive'),
  alertThresholds: z.array(z.number()).default([0.75, 0.9, 1.0]),
})

export const budgetLineItemSchema = z.object({
  budgetId: z.string(),
  name: z.string().min(1, 'Line item name is required'),
  category: z.string().min(1, 'Category is required'),
  allocatedAmount: z.number().positive('Allocated amount must be positive'),
})

export const timesheetEntrySchema = z.object({
  userId: z.string().optional(),
  projectId: z.string(),
  date: z.date(),
  description: z.string().min(1, 'Description is required'),
  hoursDecimal: z.number().positive('Hours must be positive').multipleOf(0.1, 'Hours must be in 0.1 increments'),
  source: z.enum(['NATIVE', 'CLOCKIFY_IMPORT']),
  externalRef: z.string().optional(),
})

export const externalExpenseSchema = z.object({
  projectId: z.string().optional(),
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.date(),
  description: z.string().min(1, 'Description is required'),
  amountNetMinor: z.number().positive('Net amount must be positive'),
  amountVatMinor: z.number().optional(),
  currency: z.string().default('GBP'),
  source: z.enum(['XERO_IMPORT', 'MANUAL']),
  projectCode: z.string().optional(),
  artistTag: z.string().optional(),
  externalRef: z.string().optional(),
})

export const incomeSchema = z.object({
  projectId: z.string().optional(),
  date: z.date(),
  description: z.string().min(1, 'Description is required'),
  amountMinor: z.number().positive('Amount must be positive'),
  currency: z.string().default('GBP'),
  source: z.enum(['XERO_IMPORT', 'MANUAL']),
  projectCode: z.string().optional(),
  artistTag: z.string().optional(),
  externalRef: z.string().optional(),
})

export const reconciliationSchema = z.object({
  projectId: z.string(),
  budgetLineItemId: z.string().optional(),
  kind: z.enum(['TIME', 'EXPENSE', 'WRITEOFF']),
  refTable: z.string().optional(),
  refId: z.string().optional(),
  hours: z.number().optional(),
  rateUsedMinor: z.number().optional(),
  amountMinor: z.number(),
  currency: z.string().default('GBP'),
  billingRoleId: z.string().optional(),
  writeoffReason: z.string().optional(),
})

export const csvMappingSchema = z.object({
  name: z.string().min(1, 'Mapping name is required'),
  type: z.enum(['XERO_EXPENSE', 'XERO_INCOME', 'CLOCKIFY_TIME']),
  columnMappings: z.record(z.string()),
  defaultValues: z.record(z.any()).optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type BudgetLineItemInput = z.infer<typeof budgetLineItemSchema>
export type TimesheetEntryInput = z.infer<typeof timesheetEntrySchema>
export type ExternalExpenseInput = z.infer<typeof externalExpenseSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type ReconciliationInput = z.infer<typeof reconciliationSchema>
export type CsvMappingInput = z.infer<typeof csvMappingSchema>