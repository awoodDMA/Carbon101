'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Viewer } from '@speckle/viewer-react';
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
        <Suspense fallback={null}>
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
