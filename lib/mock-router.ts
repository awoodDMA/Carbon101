import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export interface Project {
  id: string;
  name: string;
}

export interface Option {
  id: string;
  projectId: string;
  name: string;
}

export interface CarbonResult {
  optionId: string;
  value: number;
}

const projects: Project[] = [
  { id: 'p1', name: 'Circular House' },
  { id: 'p2', name: 'Metro Station' },
];

const options: Option[] = [
  { id: 'o1', projectId: 'p1', name: 'Option A' },
  { id: 'o2', projectId: 'p1', name: 'Option B' },
  { id: 'o3', projectId: 'p2', name: 'Option A' },
];

const results: CarbonResult[] = [
  { optionId: 'o1', value: 100 },
  { optionId: 'o2', value: 85 },
  { optionId: 'o3', value: 120 },
];

export const appRouter = t.router({
  projects: t.procedure.query(() => projects),
  options: t.procedure
    .input((val: unknown) => {
      if (typeof val === 'object' && val && 'projectId' in val) {
        return { projectId: String((val as any).projectId) };
      }
      throw new Error('Invalid input');
    })
    .query(({ input }) => options.filter(o => o.projectId === input.projectId)),
  carbonResults: t.procedure
    .input((val: unknown) => {
      if (typeof val === 'object' && val && 'optionId' in val) {
        return { optionId: String((val as any).optionId) };
      }
      throw new Error('Invalid input');
    })
    .query(({ input }) => results.filter(r => r.optionId === input.optionId)),
});

export type AppRouter = typeof appRouter;
