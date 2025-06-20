'use client'

import { useState } from 'react'
import { Reorder } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  title: string
  content: React.ReactNode
}

interface DraggableTabsProps {
  tabs: TabItem[]
  setTabs: (tabs: TabItem[]) => void
}

export default function DraggableTabs({ tabs, setTabs }: DraggableTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id)

  const removeTab = (id: string) => {
    const next = tabs.filter(t => t.id !== id)
    setTabs(next)
    if (active === id && next.length) setActive(next[0].id)
  }

  return (
    <div className="w-full">
      <Reorder.Group axis="x" onReorder={setTabs} values={tabs} className="mb-2 flex gap-2">
        {tabs.map(tab => (
          <Reorder.Item
            key={tab.id}
            value={tab}
            className={cn(
              'flex cursor-grab items-center gap-1 rounded-md border px-3 py-1 text-sm',
              active === tab.id && 'bg-accent text-accent-foreground'
            )}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setActive(tab.id)}
          >
            {tab.title}
            <button
              aria-label="Remove tab"
              className="ml-1"
              onClick={e => {
                e.stopPropagation()
                removeTab(tab.id)
              }}
            >
              <X className="size-3" />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="mt-4">
        {tabs.map(tab => active === tab.id && <div key={tab.id}>{tab.content}</div>)}
      </div>
    </div>
  )
}
