'use client'

import DoughnutChart from '@/components/DoughnutChart'
import AutodeskViewer from '@/components/autodesk-viewer'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useOptions } from '@/hooks/use-api'

interface ProjectPageProps {
  params: { projectId: string }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = params

  function OptionLinks() {
    const options = useOptions(projectId)
    return (
      <ul className="flex flex-col gap-2">
        {options.map((o) => (
          <li key={o.id}>
            <Link className="text-blue-600 underline" href={`/compare?optionId=${o.id}`}>Compare {o.name}</Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <main className="grid grid-cols-8 gap-4">
      <section className="col-span-3 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Project {projectId}</h1>
        <DoughnutChart />
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <OptionLinks />
        </Suspense>
      </section>
      <section className="col-span-5">
        <AutodeskViewer modelUrn="mock-urn" token="mock-token" />
      </section>
    </main>
  )
}
