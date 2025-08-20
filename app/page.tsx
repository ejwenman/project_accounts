// app/page.tsx - Temporary version without authentication
import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Temporarily skip authentication and redirect to signin
  // Later we'll add proper auth back
  redirect('/auth/signin')
}