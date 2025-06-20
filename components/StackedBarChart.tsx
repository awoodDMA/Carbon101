'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ReactECharts = React.lazy(() => import('echarts-for-react'))

export interface Series {
  name: string
  values: number[]
}

export interface StackedBarChartProps {
  categories: string[]
  series: Series[]
}

export default function StackedBarChart({ categories, series }: StackedBarChartProps) {
  const option = React.useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {},
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series: series.map(s => ({
        name: s.name,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: s.values,
      })),
    }),
    [categories, series]
  )

  return (
    <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ReactECharts option={option} style={{ height: '16rem', width: '100%' }} />
    </React.Suspense>
  )
}
