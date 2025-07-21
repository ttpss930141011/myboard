import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from './providers'
import { ModalProvider } from '@/providers/modal-provider'
import { Toaster } from '@/components/ui/sonner'
import { Loading } from '@/components/auth/loading'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MyBoard - Personal whiteboard for drawing and notes',
  description: 'Your personal whiteboard for drawing, notes, and creative thinking.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<Loading />}>
          <Providers>
            <ModalProvider />
            <Toaster />
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  )
}
