'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import useCarbonChart from '@/hooks/use-carbon-chart'
import { useCarbonResults } from '@/hooks/use-api'

function ResultGauge({ optionId }: { optionId: string }) {
  const results = useCarbonResults(optionId)
  const value = results[0]?.value ?? 0
  const chart = useCarbonChart('gauge', { value })
  return chart
}

export default function ComparePage() {
  const params = useSearchParams()
  const optionId = params.get('optionId')

  if (!optionId) return <p>No option selected</p>

  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Compare</h1>
        <ResultGauge optionId={optionId} />
      </div>
    </Suspense>
  )
}
