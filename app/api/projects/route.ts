import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth-helpers'
// import { prisma } from '@/lib/prisma'  // Commented out for now due to Bolt.new limitations
// import { projectSchema } from '@/lib/validations'
// import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // TODO: Re-enable when Prisma works in Bolt.new
    return new NextResponse('Database temporarily disabled in Bolt.new', { status: 503 })

    // const body = await request.json()
    // const validatedData = projectSchema.parse({
    //   ...body,
    //   startDate: body.startDate ? new Date(body.startDate) : undefined,
    //   endDate: body.endDate ? new Date(body.endDate) : undefined,
    // })

    // // Check if project code is unique
    // const existingProject = await prisma.project.findUnique({
    //   where: { code: validatedData.code }
    // })

    // if (existingProject) {
    //   return new NextResponse('Project code already exists', { status: 400 })
    // }

    // const project = await prisma.project.create({
    //   data: validatedData,
    //   include: {
    //     artist: true,
    //   },
    // })

    // return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // TODO: Re-enable when Prisma works in Bolt.new
    return NextResponse.json([])

    // const { searchParams } = new URL(request.url)
    // const include = searchParams.get('include')?.split(',') || []

    // const projects = await prisma.project.findMany({
    //   include: {
    //     artist: include.includes('artist'),
    //     budgets: include.includes('budgets') ? {
    //       include: {
    //         lineItems: include.includes('lineItems'),
    //       },
    //     } : false,
    //     _count: include.includes('count') ? {
    //       select: {
    //         timesheetEntries: true,
    //         externalExpenses: true,
    //       },
    //     } : false,
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // })

    // return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}