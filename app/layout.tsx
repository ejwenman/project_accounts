import './globals.css'
import type { Metadata } from 'next/metadata'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project Accounts - Budget & Time Management',
  description: 'Comprehensive project budget and time management system with multi-user support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}