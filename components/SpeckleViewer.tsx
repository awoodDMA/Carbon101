import React, { useEffect, useRef, useState } from 'react'
import '@speckle/viewer'

export interface SpeckleViewerProps {
  streamId: string
  modelId: string
  token?: string
}

const SpeckleViewer: React.FC<SpeckleViewerProps> = ({
  streamId,
  modelId,
  token
}) => {
  const ref = useRef<HTMLElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    setLoaded(false)
    const handleLoad = () => setLoaded(true)
    el.addEventListener('load-complete', handleLoad)
    return () => el.removeEventListener('load-complete', handleLoad)
  }, [streamId, modelId])

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-transparent" />
        </div>
      )}
      <viewer-container
        ref={ref}
        style={{ width: '100%', height: '100%' }}
        streamId={streamId}
        modelId={modelId}
        token={token}
      />
    </div>
  )
}

export default SpeckleViewer
