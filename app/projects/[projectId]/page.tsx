'use client'

import DoughnutChart from '@/components/DoughnutChart'
import SpeckleViewer from '@/components/SpeckleViewer'

interface ProjectPageProps {
  params: { projectId: string }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <main className="grid grid-cols-8 gap-4">
      <section className="col-span-3 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Project {params.projectId}</h1>
        <DoughnutChart />
      </section>
      <section className="col-span-5">
        <SpeckleViewer streamId="mock-stream" modelId="mock-model" />
      </section>
    </main>
  )
}
