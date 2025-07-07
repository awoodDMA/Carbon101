'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Loader2, Maximize2, RotateCcw } from 'lucide-react';
import { autodeskViewerDOMReady } from '@/lib/autodesk-viewer-dom-ready';

interface AutodeskViewerProps {
  urn?: string;
  accessToken?: string;
  width?: string;
  height?: string;
  className?: string;
  onDocumentLoad?: (doc: any) => void;
  onGeometryLoad?: (model: any) => void;
  onError?: (error: string) => void;
}

export default function AutodeskViewer({ 
  urn, 
  accessToken, 
  width = '100%', 
  height = '400px',
  className = '',
  onDocumentLoad,
  onGeometryLoad,
  onError
}: AutodeskViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef<string>(`container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const isDestroyedRef = useRef<boolean>(false); // Track component destruction
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);

  // Initialize viewer using singleton manager
  const initializeViewer = useCallback(async () => {
    if (!viewerRef.current || !urn || !accessToken || isDestroyedRef.current) {
      return;
    }

    // Ensure URN has proper format for Autodesk Viewer
    const properUrn = urn.startsWith('urn:') ? urn : `urn:${urn}`;
    console.log('🔍 AutodeskViewer: Using URN format:', properUrn);

    const containerId = containerIdRef.current;
    
    // Set container ID for tracking
    viewerRef.current.id = containerId;

    setIsLoading(true);
    setError(null);

    try {
      await autodeskViewerDOMReady.createViewer({
        urn: properUrn,
        accessToken,
        container: viewerRef.current,
        onCancelled: () => isDestroyedRef.current, // Return true if component is destroyed
        onDocumentLoad: (doc) => {
          // Check if component is still mounted before proceeding
          if (isDestroyedRef.current) {
            console.log('📄 Document loaded but component destroyed - ignoring');
            return;
          }
          console.log('📄 Document loaded via singleton manager');
          onDocumentLoad?.(doc);
        },
        onGeometryLoad: (model) => {
          // Check if component is still mounted before proceeding
          if (isDestroyedRef.current) {
            console.log('🎯 Geometry loaded but component destroyed - ignoring');
            return;
          }
          console.log('🎯 Geometry loaded via singleton manager');
          setIsLoading(false);
          onGeometryLoad?.(model);
          
          // Get viewer instance for controls
          const viewerInstance = autodeskViewerDOMReady.getCurrentViewer();
          setViewer(viewerInstance);
        },
        onError: (errorMsg) => {
          // Check if component is still mounted before proceeding
          if (isDestroyedRef.current) {
            console.log('❌ Viewer error but component destroyed - ignoring');
            return;
          }
          console.error('❌ Viewer error via singleton manager:', errorMsg);
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      });

    } catch (err) {
      // Check if component is still mounted before setting error state
      if (isDestroyedRef.current) {
        console.log('❌ Viewer initialization failed but component destroyed - ignoring');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize viewer';
      console.error('❌ Viewer initialization failed:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [urn, accessToken, onDocumentLoad, onGeometryLoad, onError]);

  // Initialize when dependencies change
  useEffect(() => {
    if (urn && accessToken) {
      initializeViewer();
    } else {
      setIsLoading(false);
      setViewer(null);
    }
  }, [urn, accessToken, initializeViewer]);

  // Cleanup on unmount
  useEffect(() => {
    const containerId = containerIdRef.current;
    
    return () => {
      console.log(`🧹 Emergency cleanup for container: ${containerId}`);
      
      // CRITICAL: Mark component as destroyed FIRST to stop async operations
      isDestroyedRef.current = true;
      
      // CRITICAL: Immediately stop all rendering before any async operations
      const currentViewer = autodeskViewerDOMReady.getCurrentViewer();
      if (currentViewer?.impl) {
        // Emergency shutdown
        currentViewer.impl.running = false;
        currentViewer.isDestroyed = true;
        
        // Stop animation loop
        if (currentViewer.impl.animLoop) {
          currentViewer.impl.animLoop.running = false;
          if (currentViewer.impl.animLoop.requestId) {
            cancelAnimationFrame(currentViewer.impl.animLoop.requestId);
          }
        }

        // Emergency renderer shutdown
        if (currentViewer.impl.renderer) {
          currentViewer.impl.renderer.setRenderTarget = () => {};
          if (currentViewer.impl.renderer.initFrameBufferMRT) {
            currentViewer.impl.renderer.initFrameBufferMRT = () => {};
          }
          currentViewer.impl.renderer.enabled = false;
        }

        // Override render function
        if (currentViewer.impl.render) {
          currentViewer.impl.render = () => {};
        }
      }
      
      // Start async cleanup (will complete after component unmount)
      autodeskViewerDOMReady.destroyViewerForContainer(containerId);
    };
  }, []);

  // Viewer controls
  const handleFullscreen = useCallback(() => {
    if (viewer && viewerRef.current) {
      viewerRef.current.requestFullscreen?.();
    }
  }, [viewer]);

  const handleReset = useCallback(() => {
    if (viewer) {
      viewer.fitToView();
    }
  }, [viewer]);

  // Expose viewer methods for external use
  const getSelectedProperties = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!viewer) {
        reject('Viewer not available');
        return;
      }

      const selection = viewer.getSelection();
      if (selection.length === 0) {
        reject('No objects selected');
        return;
      }

      const properties: any[] = [];
      let remaining = selection.length;

      selection.forEach((dbId: number) => {
        viewer.getProperties(dbId, (props: any) => {
          properties.push(props);
          remaining--;
          if (remaining === 0) {
            resolve(properties);
          }
        });
      });
    });
  }, [viewer]);

  const getAllObjectProperties = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!viewer) {
        reject('Viewer not available');
        return;
      }

      const model = viewer.model;
      if (!model) {
        reject('No model loaded');
        return;
      }

      const instanceTree = model.getInstanceTree();
      const allDbIds: number[] = [];
      
      instanceTree.enumNodeChildren(instanceTree.getRootId(), (dbId: number) => {
        allDbIds.push(dbId);
      }, true);

      const properties: any[] = [];
      let remaining = allDbIds.length;

      if (remaining === 0) {
        resolve(properties);
        return;
      }

      allDbIds.forEach((dbId: number) => {
        viewer.getProperties(dbId, (props: any) => {
          properties.push(props);
          remaining--;
          if (remaining === 0) {
            resolve(properties);
          }
        });
      });
    });
  }, [viewer]);

  // Expose methods to parent component
  useEffect(() => {
    if (viewer) {
      (viewer as any).getSelectedProperties = getSelectedProperties;
      (viewer as any).getAllObjectProperties = getAllObjectProperties;
    }
  }, [viewer, getSelectedProperties, getAllObjectProperties]);

  return (
    <div className={`relative border border-input rounded-lg overflow-hidden ${className}`}>
      {/* Viewer Controls */}
      {viewer && !isLoading && !error && urn && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 bg-background/90 border border-input rounded-md hover:bg-accent transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-background/90 border border-input rounded-md hover:bg-accent transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No Model State */}
      {!urn && (
        <div 
          className="flex items-center justify-center bg-gray-50"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Maximize2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No Model Linked</p>
            <p className="text-xs text-gray-600">Use "Link Model" to connect an Autodesk model</p>
            <p className="text-xs text-gray-500 mt-2">💡 Tip: Use the simple viewer at /viewer for testing</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && urn && (
        <div 
          className="flex items-center justify-center bg-muted"
          style={{ width, height }}
        >
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && urn && (
        <div 
          className="flex items-center justify-center bg-red-50 border-red-200"
          style={{ width, height }}
        >
          <div className="text-center text-red-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load model</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Viewer Container */}
      {urn && (
        <div
          ref={viewerRef}
          style={{ 
            width, 
            height,
            // IMPORTANT: Container must be visible for Autodesk Viewer initialization
            display: 'block',
            visibility: isLoading || error ? 'hidden' : 'visible'
          }}
          className="autodesk-viewer-container"
          id={`viewer-${containerIdRef.current}`}
        />
      )}
    </div>
  );
}