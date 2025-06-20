'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ReactECharts = React.lazy(() => import('echarts-for-react'))

const option = {
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff'
      },
      label: { show: false },
      emphasis: { label: { show: true } },
      data: [
        { value: 40, name: 'A' },
        { value: 30, name: 'B' },
        { value: 20, name: 'C' },
        { value: 10, name: 'D' }
      ]
    }
  ]
}

export default function DoughnutChart() {
  return (
    <React.Suspense fallback={<Skeleton className="h-80 w-full" />}>
      <ReactECharts option={option} style={{ height: '20rem', width: '100%' }} />
    </React.Suspense>
  )
}
