import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FirstFlat — Budget Tracker for First-Time Solo Livers',
  description: 'Track income, expenses, and predict when your money runs out. Made for students, fresh grads & young professionals living alone for the first time.',
  keywords: 'budget tracker, expense tracker, first apartment, solo living, student budget',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
