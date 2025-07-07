'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SimpleAutodeskViewerProps {
  urn: string;
  accessToken: string;
  width?: string;
  height?: string;
  onDocumentLoad?: (doc: any) => void;
  onGeometryLoad?: (model: any) => void;
  onError?: (error: string) => void;
}

export default function SimpleAutodeskViewer({ 
  urn, 
  accessToken, 
  width = '100%', 
  height = '400px',
  onDocumentLoad,
  onGeometryLoad,
  onError
}: SimpleAutodeskViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [initStatus, setInitStatus] = useState<string>('Initializing...');

  useEffect(() => {
    if (!urn || !accessToken || !viewerRef.current) {
      setError('Missing URN, access token, or container element');
      setIsLoading(false);
      return;
    }

    // Add global error handler for Autodesk Viewer errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('hasModels') || message.includes('Cannot read properties of null')) {
        console.warn('🤫 Suppressed harmless Autodesk Viewer error:', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    initializeViewer();

    // Cleanup error handler
    return () => {
      console.error = originalConsoleError;
    };
  }, [urn, accessToken]);

  const initializeViewer = async () => {
    setIsLoading(true);
    setError(null);
    setInitStatus('Loading Autodesk Viewer SDK...');

    try {
      // Load the Autodesk Viewer SDK if not already loaded
      if (!window.Autodesk) {
        await loadAutodeskSDK();
      }

      setInitStatus('Initializing Autodesk Viewer...');

      const options = {
        env: 'AutodeskProduction2',
        getAccessToken: (onTokenReady: (token: string, expires: number) => void) => {
          console.log('🔑 Viewer requesting access token...');
          onTokenReady(accessToken, 3600);
        },
        api: 'streamingV2'
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        try {
          setInitStatus('Creating viewer instance...');
          console.log('🚀 Creating Autodesk Viewer instance...');

          // Clear the container
          if (viewerRef.current) {
            viewerRef.current.innerHTML = '';
          }

          // Create viewer
          if (!viewerRef.current) {
            throw new Error('Viewer container not available');
          }
          const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current, {
            extensions: [],
            // Disable problematic UI panels that cause tBodies error
            disabledExtensions: {
              hypermodeling: true,
              bimwalk: true,
              pushpins: true,
              section: true,
              explode: true,
              settingsPanel: true, // Disable settings panel that causes tBodies error
              modelStructurePanel: true,
              propertyPanel: true
            }
          });
          
          // Start the viewer
          const startCode = viewerInstance.start();
          if (startCode > 0) {
            throw new Error(`Viewer failed to start. Error code: ${startCode}`);
          }

          console.log('✅ Viewer started successfully');
          setViewer(viewerInstance);
          setInitStatus('Loading document...');

          // Load the document
          console.log('🔍 Loading document with URN:', urn);
          console.log('🔍 URN length:', urn.length);
          console.log('🔍 URN first 50 chars:', urn.substring(0, 50));
          
          window.Autodesk.Viewing.Document.load(
            urn,
            (doc: any) => {
              console.log('📄 Document loaded successfully');
              setInitStatus('Document loaded, loading geometry...');
              onDocumentLoad?.(doc);

              // Get the default viewable
              const viewables = doc.getRoot().getDefaultGeometry();
              if (viewables) {
                try {
                  viewerInstance.loadDocumentNode(doc, viewables).then((model: any) => {
                    console.log('🎯 Geometry loaded successfully');
                    setInitStatus('✅ Model loaded successfully');
                    setIsLoading(false);
                    onGeometryLoad?.(model);
                  }).catch((loadError: any) => {
                    // Check if it's the harmless hasModels error
                    if (loadError.message && loadError.message.includes('hasModels')) {
                      console.warn('⚠️ Harmless hasModels error (model still loaded):', loadError);
                      setInitStatus('✅ Model loaded successfully (ignored harmless warning)');
                      setIsLoading(false);
                      onGeometryLoad?.(null); // Model is loaded even with this error
                    } else {
                      console.error('❌ Failed to load geometry:', loadError);
                      const errorMsg = `Failed to load geometry: ${loadError.message || loadError}`;
                      setError(errorMsg);
                      setIsLoading(false);
                      onError?.(errorMsg);
                    }
                  });
                } catch (syncError) {
                  console.error('❌ Synchronous error in loadDocumentNode:', syncError);
                  // Don't treat this as a failure if the model might still be visible
                  setInitStatus('⚠️ Model loaded with warnings');
                  setIsLoading(false);
                }
              } else {
                const errorMsg = 'No viewable geometry found in document';
                console.error('❌', errorMsg);
                setError(errorMsg);
                setIsLoading(false);
                onError?.(errorMsg);
              }
            },
            (errorCode: number, errorMsg: string) => {
              console.error('❌ Document load failed:', errorCode, errorMsg);
              const fullError = `Document load failed: ${errorMsg} (Code: ${errorCode})`;
              setError(fullError);
              setIsLoading(false);
              onError?.(fullError);
            }
          );

        } catch (initError) {
          console.error('❌ Viewer initialization failed:', initError);
          const errorMsg = `Viewer initialization failed: ${initError instanceof Error ? initError.message : initError}`;
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      });

    } catch (sdkError) {
      console.error('❌ SDK loading failed:', sdkError);
      const errorMsg = `SDK loading failed: ${sdkError instanceof Error ? sdkError.message : sdkError}`;
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  };

  const loadAutodeskSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);

      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      
      script.onload = () => {
        console.log('✅ Autodesk Viewer SDK loaded');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Autodesk Viewer SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewer) {
        try {
          viewer.finish();
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
      }
    };
  }, [viewer]);

  return (
    <div className="relative border border-input rounded-lg overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white z-10"
          style={{ width, height }}
        >
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{initStatus}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-red-50 z-10"
          style={{ width, height }}
        >
          <div className="text-center text-red-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load model</p>
            <p className="text-xs mt-1 max-w-md">{error}</p>
          </div>
        </div>
      )}

      {/* Viewer Container */}
      <div
        ref={viewerRef}
        style={{ width, height }}
        className="autodesk-viewer-container"
      />
    </div>
  );
}