import './globals.css';
import type { ReactNode } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import Providers from '@/components/providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <SidebarNav />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
