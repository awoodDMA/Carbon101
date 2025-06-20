import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Viewer } from "@speckle/viewer-react";

interface ProjectPageProps {
  params: { id: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const searchParams = useSearchParams();
  const streamId = searchParams.get("streamId") ?? "";

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Hello Project</h1>
      {streamId && (
        <Suspense fallback={null}>
          <Viewer streamId={streamId} className="w-full h-[80vh]" />
        </Suspense>
      )}
    </main>
  );
}
