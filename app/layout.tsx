import './globals.css';
import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/providers';
import PageTransition from '@/components/page-transition';
import { Inter, Fira_Code } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>
          <div className="grid min-h-screen grid-cols-[auto,1fr]">
            <Sidebar />
            <div className="bg-background">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
