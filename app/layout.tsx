import './globals.css';
import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/providers';
import PageTransition from '@/components/page-transition';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <PageTransition>{children}</PageTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
