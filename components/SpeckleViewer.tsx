'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const Viewer = dynamic(() => import('@speckle/viewer-react').then(m => m.Viewer), {
  ssr: false
})

export interface SpeckleViewerProps {
  streamId: string
  modelId?: string
  token?: string
  className?: string
}

export default function SpeckleViewer({
  streamId,
  modelId,
  token,
  className
}: SpeckleViewerProps) {
  const [full, setFull] = useState(false)
  return (
    <div
      className={cn(
        'relative h-96 w-full',
        className,
        full && 'fixed inset-0 z-50 bg-background'
      )}
    >
      <Button
        size="icon"
        variant="secondary"
        className="absolute right-2 top-2 z-10"
        onClick={() => setFull(!full)}
      >
        {full ? (
          <Minimize2 aria-hidden="true" className="size-4" />
        ) : (
          <Maximize2 aria-hidden="true" className="size-4" />
        )}
        <span className="sr-only">Full-screen</span>
      </Button>
      <Viewer
        streamId={streamId}
        modelId={modelId}
        token={token}
        className="size-full"
      />
    </div>
  )
}
