'use client'

import { useState } from 'react'
import useCarbonChart from '@/hooks/use-carbon-chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const metrics = [
  { name: 'A1-A3', max: 100 },
  { name: 'A4', max: 100 },
  { name: 'A5', max: 100 }
]

const datasets = [
  {
    id: 'set1',
    name: 'Concept set 1',
    leftLabel: 'Option A',
    rightLabel: 'Option B',
    left: { indicators: metrics, values: [40, 20, 10] },
    right: { indicators: metrics, values: [35, 25, 15] }
  },
  {
    id: 'set2',
    name: 'Concept set 2',
    leftLabel: 'Option C',
    rightLabel: 'Option D',
    left: { indicators: metrics, values: [50, 30, 20] },
    right: { indicators: metrics, values: [45, 35, 25] }
  }
]

export default function ComparePage() {
  const [current, setCurrent] = useState(datasets[0])
  const leftChart = useCarbonChart('radar', current.left)
  const rightChart = useCarbonChart('radar', current.right)

  const rows = current.left.indicators.map((m, i) => {
    const a = current.left.values[i]
    const b = current.right.values[i]
    const diff = ((b - a) / a) * 100
    return { name: m.name, a, b, diff }
  })

  return (
    <div className="flex flex-col gap-6">
      <select
        aria-label="Dataset"
        value={current.id}
        onChange={(e) =>
          setCurrent(datasets.find((d) => d.id === e.target.value)!)
        }
        className="w-48 rounded border p-2"
      >
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{current.leftLabel}</CardTitle>
          </CardHeader>
          <CardContent>{leftChart}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{current.rightLabel}</CardTitle>
          </CardHeader>
          <CardContent>{rightChart}</CardContent>
        </Card>
      </div>
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Metric</th>
            <th className="p-2 text-left">{current.leftLabel}</th>
            <th className="p-2 text-left">{current.rightLabel}</th>
            <th className="p-2 text-left">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.a}</td>
              <td className="p-2">{row.b}</td>
              <td className="p-2">
                <span
                  className={`rounded px-2 py-0.5 ${
                    row.diff >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {row.diff >= 0 ? '+' : ''}
                  {row.diff.toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
