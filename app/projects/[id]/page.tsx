'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const Viewer = dynamic(() => import('@speckle/viewer-react').then(m => m.Viewer), {
  ssr: false,
  suspense: true,
});
import OptionDrawer from '@/components/option-drawer';

interface ProjectPageProps {
  params: { id: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const searchParams = useSearchParams();
  const streamId = searchParams.get('streamId') ?? '';
  const optionId = searchParams.get('optionId') ?? '';

  return (
    <main className="relative flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Hello Project</h1>
      <OptionDrawer />
      {streamId && (
        <Suspense fallback={<Skeleton className="h-[80vh] w-full" />}>
          <Viewer
            key={optionId}
            streamId={streamId}
            className="w-full h-[80vh]"
          />
        </Suspense>
      )}
    </main>
  );
}
