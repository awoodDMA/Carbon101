'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DraggableTabs, { TabItem } from '@/components/DraggableTabs'
import StackedBarChart, { Series } from '@/components/StackedBarChart'

const categories = ['A1-A3', 'A4', 'A5']

function makeSeries(): Series[] {
  return [
    { name: 'Concrete', values: categories.map(() => Math.floor(Math.random() * 40 + 10)) },
    { name: 'Steel', values: categories.map(() => Math.floor(Math.random() * 20 + 5)) },
  ]
}

export default function ComparePage() {
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'tab-1', title: 'Option 1', content: <StackedBarChart categories={categories} series={makeSeries()} /> },
  ])

  const addTab = () => {
    const next: TabItem = {
      id: `tab-${Date.now()}`,
      title: `Option ${tabs.length + 1}`,
      content: <StackedBarChart categories={categories} series={makeSeries()} />,
    }
    setTabs([...tabs, next])
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <select className="rounded border p-2">
          <option>All options</option>
        </select>
        <Button onClick={addTab}>Add tab</Button>
      </header>
      <DraggableTabs tabs={tabs} setTabs={setTabs} />
    </div>
  )
}
