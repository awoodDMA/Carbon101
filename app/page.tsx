'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-api';

function ProjectGrid() {
  const projects = useProjects();
  return (
    <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => (
        <div
          key={p.id}
          className="rounded-xl bg-white/10 p-6 shadow transition hover:bg-emerald/10"
        >
          <div className="mb-4 h-32 w-full rounded bg-charcoal/20" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-center font-medium">{p.name}</span>
            <Button asChild size="sm">
              <Link href={`/projects/${p.id}`}>Enter</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <ProjectGrid />
    </Suspense>
  );
}
