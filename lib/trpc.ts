import { createTRPCReact } from '@trpc/react-query';
import { experimental_localLink } from '@trpc/client';
import type { AppRouter } from './mock-router';
import { appRouter } from './mock-router';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    experimental_localLink({
      router: appRouter,
      createContext: () => ({}),
    }),
  ],
});
