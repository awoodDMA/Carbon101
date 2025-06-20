import { createTRPCReact } from '@trpc/react-query';
import { experimental_localLink, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './mock-router';
import { appRouter } from './mock-router';

export const trpc = createTRPCReact<AppRouter>();

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const isBrowser = typeof window !== 'undefined' && !process.env.JEST_WORKER_ID;

export const trpcClient = trpc.createClient({
  links: isBrowser
    ? [httpBatchLink({ url: `${apiUrl}/api/trpc` })]
    : [
        apiUrl
          ? httpBatchLink({ url: `${apiUrl}/api/trpc` })
          : experimental_localLink({
              router: appRouter,
              createContext: async () => ({}),
            }),
      ],
});
