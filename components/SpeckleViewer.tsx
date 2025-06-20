import React from 'react'
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
  return (
    <viewer-container
      style={{ width: '100%', height: '100%' }}
      streamId={streamId}
      modelId={modelId}
      token={token}
    />
  )
}

export default SpeckleViewer
