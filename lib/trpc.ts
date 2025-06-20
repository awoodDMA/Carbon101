import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL ?? ''}/trpc`,
    }),
  ],
});
