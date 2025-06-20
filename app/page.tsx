'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-api';

function ProjectCards() {
  const projects = useProjects();
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <Card key={p.id}>
          <CardContent className="flex h-32 items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">Thumbnail {i + 1}</span>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="font-medium">{p.name}</span>
            <Button asChild size="sm">
              <Link href={`/projects/${p.id}`}>Enter</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <ProjectCards />
    </Suspense>
  );
}
