import './globals.css'
import type { ReactNode } from 'react'
import SidebarNav from '@/components/sidebar-nav'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 p-4">{children}</main>
        </div>
      </body>
    </html>
  )
}
