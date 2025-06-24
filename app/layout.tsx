import '../styles/globals.css';
import type { ReactNode } from 'react';
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
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}> 
      <body className="font-sans antialiased bg-background flex items-center justify-center min-h-screen">
        {children}
      </body>
    </html>
  );
}
