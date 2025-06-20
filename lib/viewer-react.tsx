import React from 'react'

export interface ViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  streamId?: string
  modelId?: string
  token?: string
}

export const Viewer: React.FC<ViewerProps> = ({
  streamId,
  modelId,
  token,
  ...props
}) => (
  <div data-stream-id={streamId} data-model-id={modelId} data-token={token} {...props} />
)
