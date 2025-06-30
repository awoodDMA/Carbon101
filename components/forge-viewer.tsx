'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

function ForgeViewerInner() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: Autodesk.Viewing.GuiViewer3D | undefined;

    const load = async () => {
      await import('forge-viewer');
      Autodesk.Viewing.Initializer({}, () => {
        if (container.current) {
          viewer = new Autodesk.Viewing.GuiViewer3D(container.current);
          viewer.start();
        }
      });
    };

    load();
    return () => viewer?.finish();
  }, []);

  return <div ref={container} className="h-96 w-full" />;
}

export default dynamic(() => Promise.resolve(ForgeViewerInner), { ssr: false });
