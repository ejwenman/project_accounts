import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { TimesheetSource, ExpenseSource, IncomeSource } from '@prisma/client'

export interface CsvMapping {
  id?: string
  name: string
  type: 'XERO_EXPENSE' | 'XERO_INCOME' | 'CLOCKIFY_TIME'
  columnMappings: Record<string, string>
  defaultValues?: Record<string, any>
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  preview?: any[]
}

export function parseCsvFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message))
        } else {
          resolve(results.data as any[])
        }
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

export async function previewImport(data: any[], mapping: CsvMapping): Promise<any[]> {
  // Take first 5 rows for preview
  const preview = data.slice(0, 5).map(row => {
    const mapped: any = {}
    
    // Apply column mappings
    Object.entries(mapping.columnMappings).forEach(([field, csvColumn]) => {
      mapped[field] = row[csvColumn]
    })
    
    // Apply default values
    if (mapping.defaultValues) {
      Object.entries(mapping.defaultValues).forEach(([field, value]) => {
        if (!mapped[field]) {
          mapped[field] = value
        }
      })
    }
    
    return mapped
  })
  
  return preview
}

export async function importXeroExpenses(data: any[], mapping: CsvMapping, userId: string): Promise<ImportResult> {
  const errors: string[] = []
  let imported = 0
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i]
      const mapped: any = {}
      
      // Apply mappings
      Object.entries(mapping.columnMappings).forEach(([field, csvColumn]) => {
        mapped[field] = row[csvColumn]
      })
      
      // Apply defaults
      if (mapping.defaultValues) {
        Object.entries(mapping.defaultValues).forEach(([field, value]) => {
          if (!mapped[field]) {
            mapped[field] = value
          }
        })
      }
      
      // Convert and validate data
      const expenseData = {
        vendor: mapped.vendor || 'Unknown Vendor',
        date: new Date(mapped.date),
        description: mapped.description || '',
        amountNetMinor: Math.round(parseFloat(mapped.amountNet || '0') * 100),
        amountVatMinor: mapped.amountVat ? Math.round(parseFloat(mapped.amountVat) * 100) : null,
        currency: mapped.currency || 'GBP',
        source: ExpenseSource.XERO_IMPORT,
        projectCode: mapped.projectCode || null,
        artistTag: mapped.artistTag || null,
        externalRef: mapped.externalRef || null,
      }
      
      // Try to match project by code
      let projectId = null
      if (mapped.projectCode) {
        const project = await prisma.project.findUnique({
          where: { code: mapped.projectCode }
        })
        projectId = project?.id || null
      }
      
      await prisma.externalExpense.create({
        data: {
          ...expenseData,
          projectId,
        }
      })
      
      imported++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    imported,
    errors,
  }
}

export async function importXeroIncome(data: any[], mapping: CsvMapping, userId: string): Promise<ImportResult> {
  const errors: string[] = []
  let imported = 0
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i]
      const mapped: any = {}
      
      // Apply mappings
      Object.entries(mapping.columnMappings).forEach(([field, csvColumn]) => {
        mapped[field] = row[csvColumn]
      })
      
      // Apply defaults
      if (mapping.defaultValues) {
        Object.entries(mapping.defaultValues).forEach(([field, value]) => {
          if (!mapped[field]) {
            mapped[field] = value
          }
        })
      }
      
      // Convert and validate data
      const incomeData = {
        date: new Date(mapped.date),
        description: mapped.description || '',
        amountMinor: Math.round(parseFloat(mapped.amount || '0') * 100),
        currency: mapped.currency || 'GBP',
        source: IncomeSource.XERO_IMPORT,
        projectCode: mapped.projectCode || null,
        artistTag: mapped.artistTag || null,
        externalRef: mapped.externalRef || null,
      }
      
      // Try to match project by code
      let projectId = null
      if (mapped.projectCode) {
        const project = await prisma.project.findUnique({
          where: { code: mapped.projectCode }
        })
        projectId = project?.id || null
      }
      
      await prisma.income.create({
        data: {
          ...incomeData,
          projectId,
        }
      })
      
      imported++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    imported,
    errors,
  }
}

export async function importClockifyTime(data: any[], mapping: CsvMapping, userId: string): Promise<ImportResult> {
  const errors: string[] = []
  let imported = 0
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i]
      const mapped: any = {}
      
      // Apply mappings
      Object.entries(mapping.columnMappings).forEach(([field, csvColumn]) => {
        mapped[field] = row[csvColumn]
      })
      
      // Apply defaults
      if (mapping.defaultValues) {
        Object.entries(mapping.defaultValues).forEach(([field, value]) => {
          if (!mapped[field]) {
            mapped[field] = value
          }
        })
      }
      
      // Convert hours to decimal (handle various formats)
      let hoursDecimal = 0
      if (mapped.hours) {
        if (mapped.hours.includes(':')) {
          // Format like "4:30"
          const [hours, minutes] = mapped.hours.split(':')
          hoursDecimal = parseInt(hours) + (parseInt(minutes) / 60)
        } else {
          hoursDecimal = parseFloat(mapped.hours)
        }
      }
      
      // Round to nearest 0.1 (6-minute increment)
      hoursDecimal = Math.round(hoursDecimal * 10) / 10
      
      if (hoursDecimal <= 0) {
        errors.push(`Row ${i + 1}: Invalid hours value`)
        continue
      }
      
      // Find user by email or name
      let userId_resolved = userId // default to current user
      if (mapped.userEmail) {
        const user = await prisma.user.findUnique({
          where: { email: mapped.userEmail }
        })
        if (user) {
          userId_resolved = user.id
        }
      }
      
      // Find project by code
      let projectId = null
      if (mapped.projectCode) {
        const project = await prisma.project.findUnique({
          where: { code: mapped.projectCode }
        })
        if (project) {
          projectId = project.id
        } else {
          errors.push(`Row ${i + 1}: Project not found: ${mapped.projectCode}`)
          continue
        }
      } else {
        errors.push(`Row ${i + 1}: Project code is required`)
        continue
      }
      
      await prisma.timesheetEntry.create({
        data: {
          userId: userId_resolved,
          projectId,
          date: new Date(mapped.date),
          description: mapped.description || '',
          hoursDecimal,
          source: TimesheetSource.CLOCKIFY_IMPORT,
          externalRef: mapped.externalRef || null,
        }
      })
      
      imported++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    imported,
    errors,
  }
}