'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function useProjects() {
  const [data] = trpc.projects.useSuspenseQuery();
  useEffect(() => {
    console.log('projects', data);
  }, [data]);
  return data;
}

export function useOptions(projectId: string) {
  const [data] = trpc.options.useSuspenseQuery({ projectId });
  useEffect(() => {
    console.log('options', data);
  }, [data]);
  return data;
}

export function useCarbonResults(optionId: string) {
  const [data] = trpc.carbonResults.useSuspenseQuery({ optionId });
  useEffect(() => {
    console.log('results', data);
  }, [data]);
  return data;
}
