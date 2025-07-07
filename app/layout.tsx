import '../styles/globals.css';
import type { ReactNode } from 'react';
import { Roboto, Fira_Code } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import ConditionalLayout from '@/components/ConditionalLayout';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
    <html lang="en" className={`${roboto.variable} ${firaCode.variable}`}> 
      <head>
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=no" />
        <meta charSet="utf-8" />
        <link rel="stylesheet" href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css" crossOrigin="anonymous" />
        <script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js" async crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-background">
        <AuthProvider>
          <ErrorBoundary>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <GlobalErrorHandler />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
