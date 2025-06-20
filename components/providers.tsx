'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { trpc, trpcClient } from '@/lib/trpc'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
}
