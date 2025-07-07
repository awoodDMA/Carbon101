'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectPageProps {
  params: { projectId: string }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = params;
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first option (Option A) by default using Next.js router
    router.replace(`/projects/${projectId}/option-A`);
  }, [projectId, router]);

  return (
    <div className="container-spacing">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
