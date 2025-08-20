// lib/auth-helpers.ts
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function getSessionFromRequest(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) return null
    
    return {
      user: {
        id: token.sub!,
        name: token.name,
        email: token.email,
        role: token.role
      }
    }
  } catch (error) {
    console.error('Error getting session from request:', error)
    return null
  }
}