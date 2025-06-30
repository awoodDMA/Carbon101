'use client'

import { useEffect, useRef } from 'react'

export interface AutodeskViewerProps {
  modelUrn: string
  token: string
}

export default function AutodeskViewer({ modelUrn, token }: AutodeskViewerProps) {
  const viewerDiv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let viewer: Autodesk.Viewing.GuiViewer3D | undefined
    const opts = { env: 'AutodeskProduction', accessToken: token }

    Autodesk.Viewing.Initializer(opts, () => {
      if (!viewerDiv.current) return
      viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current)
      viewer.start()
      viewer.loadModel(`urn:${modelUrn}`)
    })

    return () => viewer?.finish()
  }, [modelUrn, token])

  return <div ref={viewerDiv} className="h-full w-full" />
}
