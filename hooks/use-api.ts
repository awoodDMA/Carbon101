'use client';

import { trpc } from '@/lib/trpc';

export function useProjects() {
  const [data] = trpc.projects.useSuspenseQuery();
  return data;
}

export function useOptions(projectId: string) {
  const [data] = trpc.options.useSuspenseQuery({ projectId });
  return data;
}

export function useCarbonResults(optionId: string) {
  const [data] = trpc.carbonResults.useSuspenseQuery({ optionId });
  return data;
}
