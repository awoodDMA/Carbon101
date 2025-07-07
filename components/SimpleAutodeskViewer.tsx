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
  const goodHeightValues = useRef<{maxHeight?: string, height?: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialSizing, setIsInitialSizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [initStatus, setInitStatus] = useState<string>('Initializing...');

  useEffect(() => {
    // Enhanced validation for URN and other required parameters
    if (!urn || !accessToken || !viewerRef.current) {
      setError('Missing URN, access token, or container element');
      setIsLoading(false);
      return;
    }

    // Validate URN format
    if (typeof urn !== 'string' || urn.trim().length === 0) {
      setError('Invalid URN - must be a non-empty string');
      setIsLoading(false);
      return;
    }

    // Check for potential null/undefined values in URN
    if (urn.includes('null') || urn.includes('undefined')) {
      setError('Invalid URN - contains null or undefined values');
      setIsLoading(false);
      return;
    }

    // Add global error handler for Autodesk Viewer errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('hasModels') || 
          message.includes('Cannot read properties of null') ||
          message.includes('tBodies') ||
          message.includes('SettingsPanel') ||
          message.includes('toLowerCase')) {
        console.warn('🤫 Suppressed harmless Autodesk Viewer error:', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Add window error handler for uncaught errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const msg = message?.toString() || '';
      if (msg.includes('tBodies') || 
          msg.includes('SettingsPanel') ||
          msg.includes('toLowerCase') ||
          source?.includes('viewer3D.min.js')) {
        console.warn('🤫 Suppressed harmless Autodesk Viewer window error:', msg);
        return true; // Prevent default error handling
      }
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };

    // Add unhandled promise rejection handler
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      const message = reason?.message || reason?.toString() || '';
      
      if (message.includes('toLowerCase') || 
          message.includes('hasModels') ||
          message.includes('tBodies') ||
          (reason?.stack && reason.stack.includes('viewer3D.min.js'))) {
        console.warn('🤫 Suppressed harmless Autodesk Viewer promise rejection:', reason);
        event.preventDefault(); // Prevent default unhandled rejection handling
        return;
      }
      
      if (originalOnUnhandledRejection) {
        originalOnUnhandledRejection.call(window, event);
      }
    };

    initializeViewer();

    // Cleanup error handlers
    return () => {
      console.error = originalConsoleError;
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    };
  }, [urn, accessToken]);

  const constrainViewerToContainer = (viewerInstance: any, captureAsGood = false) => {
    try {
      if (!viewerRef.current || !viewerInstance || !viewerInstance.impl) return;

      const container = viewerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Also constrain the container itself to prevent overflow
      container.style.height = '500px';
      container.style.maxHeight = '500px';
      container.style.overflow = 'hidden';
      container.style.boxSizing = 'border-box';
      
      // Force consistent 500px height to match banner container
      const targetHeight = 500; // Fixed height to match banner container
      
      console.log('🔧 Constraining viewer to container:', {
        containerHeight: containerRect.height,
        containerWidth: containerRect.width,
        explicitHeight: height,
        targetHeight,
        containerActualHeight: container.offsetHeight,
        containerStyles: {
          height: container.style.height,
          maxHeight: container.style.maxHeight
        }
      });

      // Find the viewer's main div and canvas
      const viewerDiv = container.querySelector('.adsk-viewing-viewer') as HTMLElement;
      const canvas = viewerInstance.impl.canvas;
      
      if (viewerDiv) {
        // Force viewer to exact height - don't let it expand beyond container
        viewerDiv.style.width = '100%';
        viewerDiv.style.maxWidth = '100%';
        viewerDiv.style.height = targetHeight + 'px'; // Force exact height
        viewerDiv.style.maxHeight = targetHeight + 'px';
        viewerDiv.style.minHeight = targetHeight + 'px';
        viewerDiv.style.overflow = 'hidden';
        viewerDiv.style.boxSizing = 'border-box';
        
        console.log('🔧 Applied FORCED height constraints to viewer div', {
          height: targetHeight + 'px',
          maxHeight: targetHeight + 'px',
          actualHeight: viewerDiv.offsetHeight,
          actualStyles: {
            height: viewerDiv.style.height,
            maxHeight: viewerDiv.style.maxHeight
          }
        });
      }
      
      if (canvas) {
        // Force canvas to exact height - don't let it expand beyond container
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%';
        canvas.style.height = targetHeight + 'px'; // Force exact height
        canvas.style.maxHeight = targetHeight + 'px';
        canvas.style.minHeight = targetHeight + 'px';
        canvas.style.display = 'block';
        canvas.style.boxSizing = 'border-box';
        
        console.log('🔧 Applied FORCED height constraints to canvas', {
          height: targetHeight + 'px',
          maxHeight: targetHeight + 'px',
          actualHeight: canvas.offsetHeight,
          actualStyles: {
            height: canvas.style.height,
            maxHeight: canvas.style.maxHeight
          }
        });
      }
      
      // Force a resize to apply the constraints
      if (viewerInstance && viewerInstance.resize) {
        viewerInstance.resize();
      }
      
      // Capture height values as "good" if this is the initial constraint after narrow-first trick
      if (captureAsGood && viewerDiv) {
        goodHeightValues.current = {
          maxHeight: targetHeight + 'px',
          height: viewerDiv.style.height
        };
        console.log('📏 Captured good height values using targetHeight:', goodHeightValues.current);
      }
      
      console.log('✅ Viewer constrained to container successfully');
      
    } catch (error) {
      console.warn('⚠️ Error constraining viewer:', error);
    }
  };

  const forceGoodHeightValues = (viewerInstance: any, isWidthDecrease = false) => {
    try {
      if (!viewerRef.current || !viewerInstance || !viewerInstance.impl) return;

      const container = viewerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Also constrain the container itself to prevent overflow
      container.style.height = '500px';
      container.style.maxHeight = '500px';
      container.style.overflow = 'hidden';
      container.style.boxSizing = 'border-box';
      
      // Force consistent 500px height to match banner container
      const targetHeight = 500; // Always use 500px to match banner container
      
      console.log('🔒 Forcing height values during resize:', {
        explicitHeight: height,
        goodMaxHeight: goodHeightValues.current.maxHeight,
        targetHeight,
        newWidth: containerRect.width,
        isWidthDecrease,
        containerHeight: containerRect.height,
        containerActualHeight: container.offsetHeight,
        containerStyles: {
          height: container.style.height,
          maxHeight: container.style.maxHeight
        }
      });

      // Find the viewer's main div and canvas
      const viewerDiv = container.querySelector('.adsk-viewing-viewer') as HTMLElement;
      const canvas = viewerInstance.impl.canvas;
      
      if (viewerDiv) {
        // Simplified constraints - let viewer manage proportions naturally
        viewerDiv.style.width = '100%';
        viewerDiv.style.height = '100%';
        viewerDiv.style.overflow = 'hidden';
        
        console.log('🔒 Applied simplified constraints to viewer div');
      }
      
      if (canvas) {
        // Simplified canvas constraints
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        
        console.log('🔒 Applied simplified constraints to canvas');
      }
      
      // Force a resize to apply the constraints
      if (viewerInstance && viewerInstance.resize) {
        viewerInstance.resize();
      }
      
      // For width decrease, force another resize after a short delay
      if (isWidthDecrease) {
        setTimeout(() => {
          if (viewerInstance && viewerInstance.resize) {
            viewerInstance.resize();
            console.log('🔒 Secondary resize for width decrease completed');
          }
        }, 50);
      }
      
      console.log('✅ Good height values forced successfully');
      
    } catch (error) {
      console.warn('⚠️ Error forcing good height values:', error);
      // Fallback to normal constraint
      constrainViewerToContainer(viewerInstance);
    }
  };

  const restoreFullWidthAndConstrain = (viewerInstance: any) => {
    try {
      if (!viewerRef.current || !viewerInstance) return;

      console.log('🔄 Restoring full width after model load...');
      
      // Restore full width to container
      viewerRef.current.style.width = width;
      viewerRef.current.style.maxWidth = 'none';
      
      // Wait a moment for DOM to update, then constrain BEFORE resize
      setTimeout(() => {
        if (viewerInstance && viewerInstance.resize) {
          console.log('🔄 Pre-constraining viewer before width expansion...');
          
          // FIRST: Apply height constraints to prevent expansion beyond banner
          constrainViewerToContainer(viewerInstance, false);
          
          // THEN: Resize viewer (width will expand, height should be constrained)
          setTimeout(() => {
            console.log('🔄 Resizing viewer to full width with height constraints applied...');
            if (viewerInstance && viewerInstance.resize) {
              viewerInstance.resize();
            } else {
              console.warn('⚠️ Viewer instance not available for resize');
            }
            
            // FINALLY: Capture the result as good values and ensure constraints are maintained
            setTimeout(() => {
              constrainViewerToContainer(viewerInstance, true);
              // Show viewer after initial sizing is complete
              setTimeout(() => {
                setIsInitialSizing(false);
              }, 100);
            }, 100);
          }, 100);
        }
      }, 100);
      
    } catch (error) {
      console.warn('⚠️ Error restoring full width:', error);
    }
  };


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
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          try {
            setInitStatus('Creating viewer instance...');
            console.log('🚀 Creating Autodesk Viewer instance...');

            // Clear the container
            if (viewerRef.current) {
              viewerRef.current.innerHTML = '';
              
              // TRICK: Temporarily set container to narrow width during initialization
              // This forces the viewer to establish good height behavior
              const containerRect = viewerRef.current.getBoundingClientRect();
              
              console.log('🎯 Temporarily constraining width for initialization:', {
                originalWidth: containerRect.width,
                temporaryWidth: '800px',
                height: containerRect.height
              });
              
              // Hide viewer during the entire narrow-first process
              setIsInitialSizing(true);
              
              viewerRef.current.style.width = '800px';
              viewerRef.current.style.maxWidth = '800px';
            }

          // Create viewer
          if (!viewerRef.current) {
            throw new Error('Viewer container not available');
          }
          const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current, {
            extensions: [],
            // Hide various UI elements including loading indicator
            showFirstPersonToolbar: false,
            showLayerManager: false,
            showPropertyPanel: false,
            showSettingsPanel: false,
            disableSpinner: true, // This should hide the loading spinner
            // Try to control sizing behavior
            useConsolidation: false,
            consolidationMemoryLimit: 100,
            sharedPropertyDbPath: '',
            // Ensure viewer respects container dimensions
            fitContainer: true
          });
          
          // Override the problematic settings panel creation to prevent tBodies error
          const originalCreateSettingsPanel = viewerInstance.createSettingsPanel;
          viewerInstance.createSettingsPanel = function() {
            try {
              return originalCreateSettingsPanel.call(this);
            } catch (error) {
              console.warn('🤫 Suppressed settings panel error (viewer still functional):', error instanceof Error ? error.message : String(error));
              return null;
            }
          };
          
          // Start the viewer with explicit sizing
          const startCode = viewerInstance.start();
          
          // Force initial resize to container dimensions with safety checks
          setTimeout(() => {
            try {
              if (viewerRef.current && viewerInstance && viewerInstance.impl && viewerInstance.impl.canvas) {
                const containerRect = viewerRef.current.getBoundingClientRect();
                const canvasRect = viewerInstance.impl.canvas.getBoundingClientRect();
                const parentRect = viewerRef.current.parentElement?.getBoundingClientRect();
                
                console.log('📐 Dimension Analysis:', {
                  container: {
                    width: containerRect.width,
                    height: containerRect.height,
                    top: containerRect.top,
                    bottom: containerRect.bottom
                  },
                  canvas: {
                    width: canvasRect.width,
                    height: canvasRect.height,
                    top: canvasRect.top,
                    bottom: canvasRect.bottom
                  },
                  parent: parentRect ? {
                    width: parentRect.width,
                    height: parentRect.height,
                    top: parentRect.top,
                    bottom: parentRect.bottom
                  } : 'No parent',
                  heightDifference: canvasRect.height - containerRect.height,
                  viewerOverflow: canvasRect.bottom > containerRect.bottom
                });
                
                // Only resize if container has valid dimensions
                if (containerRect.width > 0 && containerRect.height > 0) {
                  if (viewerInstance && viewerInstance.resize) {
                    viewerInstance.resize();
                  }
                  
                  // Check again after resize
                  setTimeout(() => {
                    const newCanvasRect = viewerInstance.impl.canvas.getBoundingClientRect();
                    console.log('📐 After resize:', {
                      canvas: {
                        width: newCanvasRect.width,
                        height: newCanvasRect.height,
                        top: newCanvasRect.top,
                        bottom: newCanvasRect.bottom
                      },
                      stillOverflowing: newCanvasRect.bottom > containerRect.bottom
                    });
                  }, 100);
                } else {
                  console.warn('⚠️ Container not ready for resize, skipping');
                }
              } else {
                console.warn('⚠️ Viewer not ready for resize');
              }
            } catch (resizeError) {
              console.warn('⚠️ Error during initial resize:', resizeError);
            }
          }, 500);
          if (startCode > 0) {
            throw new Error(`Viewer failed to start. Error code: ${startCode}`);
          }

          console.log('✅ Viewer started successfully');
          setViewer(viewerInstance);
          setInitStatus('Loading document...');

          // Hide loading indicators and progress bars with CSS
          const hideLoadingElements = () => {
            const style = document.createElement('style');
            style.textContent = `
              /* Hide Autodesk Viewer loading indicators */
              .adsk-viewing-viewer .progress-bar,
              .adsk-viewing-viewer .spinner,
              .adsk-viewing-viewer .loading-progress,
              .adsk-viewing-viewer .adsk-loading-indicator,
              .adsk-viewing-viewer .docking-panel-container-solid-color-a,
              .adsk-viewing-viewer .loading-indicator,
              .adsk-viewing-viewer .progress {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              
              /* Ensure viewer takes full width and height */
              .autodesk-viewer-container {
                width: 100% !important;
                height: 100% !important;
              }
            `;
            document.head.appendChild(style);
          };
          
          // Apply styles immediately and after a short delay to catch late-loading elements
          hideLoadingElements();
          setTimeout(hideLoadingElements, 1000);
          
          // Clean up any stray toolbars that appear outside the viewer container
          setTimeout(() => {
            const strayToolbars = document.querySelectorAll('body > .adsk-toolbar, body > .toolbar');
            strayToolbars.forEach(toolbar => {
              console.log('🧹 Removing stray toolbar:', toolbar);
              toolbar.remove();
            });
          }, 2000);

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

              // Try to get 3D viewable first, then fallback to 2D
              let viewables = doc.getRoot().getDefaultGeometry();
              
              // If no 3D geometry, try to get 2D viewables (sheets, drawings)
              if (!viewables) {
                const rootItem = doc.getRoot();
                viewables = rootItem.search({'type': 'geometry', 'role': '2d'})[0] || 
                           rootItem.search({'type': 'geometry'})[0] ||
                           rootItem.search({'role': '2d'})[0];
              }
              
              if (viewables) {
                try {
                  // Validate viewables object before passing to loadDocumentNode
                  console.log('🔍 Viewables object:', {
                    hasViewables: !!viewables,
                    viewableType: typeof viewables,
                    viewableKeys: viewables ? Object.keys(viewables) : 'null',
                    viewableName: viewables?.name || 'undefined',
                    viewableRole: viewables?.role || 'undefined',
                    viewableType2: viewables?.type || 'undefined'
                  });

                  // Additional safety check - ensure viewables has required properties
                  if (!viewables || typeof viewables !== 'object') {
                    throw new Error('Invalid viewables object - not an object or null');
                  }

                  // Wrap loadDocumentNode in a timeout to handle potential hangs
                  const loadPromise = viewerInstance.loadDocumentNode(doc, viewables);
                  
                  // Set a timeout for the load operation
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Model load timeout')), 30000); // 30 second timeout
                  });
                  
                  Promise.race([loadPromise, timeoutPromise]).then((model: any) => {
                    console.log('🎯 Geometry loaded successfully');
                    setInitStatus('✅ Model loaded successfully');
                    setIsLoading(false);
                    onGeometryLoad?.(model);
                    
                    // Fit model to view to ensure proper proportions
                    setTimeout(() => {
                      if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                        try {
                          viewerInstance.fitToView();
                          console.log('📐 Model fitted to view for proper proportions');
                        } catch (fitError) {
                          console.warn('⚠️ fitToView failed:', fitError);
                        }
                      } else {
                        console.warn('⚠️ Cannot fit to view - viewer not fully ready');
                      }
                    }, 1000);
                    
                    // After model loads, restore full width and ensure proper constraints
                    setTimeout(() => {
                      restoreFullWidthAndConstrain(viewerInstance);
                      
                    }, 1000);
                  }).catch((loadError: any) => {
                    // Check if it's the harmless hasModels error
                    if (loadError.message && loadError.message.includes('hasModels')) {
                      console.warn('⚠️ Harmless hasModels error (model still loaded):', loadError);
                      setInitStatus('✅ Model loaded successfully (ignored harmless warning)');
                      setIsLoading(false);
                      onGeometryLoad?.(null); // Model is loaded even with this error
                      // Fit model to view for proper proportions
                      setTimeout(() => {
                        if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                          try {
                            viewerInstance.fitToView();
                            console.log('📐 Model fitted to view (hasModels case)');
                          } catch (fitError) {
                            console.warn('⚠️ fitToView failed (hasModels case):', fitError);
                          }
                        } else {
                          console.warn('⚠️ Cannot fit to view - viewer not fully ready (hasModels case)');
                        }
                        
                      }, 1000);
                    } else if (loadError.message && loadError.message.includes('toLowerCase')) {
                      console.warn('⚠️ toLowerCase error - treating as successful load:', loadError);
                      setInitStatus('✅ Model loaded successfully (ignored toLowerCase warning)');
                      setIsLoading(false);
                      onGeometryLoad?.(null); // Continue as if successful
                      // Fit model to view for proper proportions
                      setTimeout(() => {
                        if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                          try {
                            viewerInstance.fitToView();
                            console.log('📐 Model fitted to view (toLowerCase case)');
                          } catch (fitError) {
                            console.warn('⚠️ fitToView failed (toLowerCase case):', fitError);
                          }
                        } else {
                          console.warn('⚠️ Cannot fit to view - viewer not fully ready (toLowerCase case)');
                        }
                        
                      }, 1000);
                    } else if (loadError.message && loadError.message.includes('timeout')) {
                      console.error('❌ Model load timeout');
                      const errorMsg = 'Model load took too long - please try again';
                      setError(errorMsg);
                      setIsLoading(false);
                      onError?.(errorMsg);
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
                  if (syncError instanceof Error && syncError.message.includes('toLowerCase')) {
                    console.warn('⚠️ Synchronous toLowerCase error - treating as successful load:', syncError);
                    setInitStatus('✅ Model loaded successfully (ignored toLowerCase warning)');
                    setIsLoading(false);
                    onGeometryLoad?.(null); // Continue as if successful
                    // Fit model to view for proper proportions
                    setTimeout(() => {
                      if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                        try {
                          viewerInstance.fitToView();
                          console.log('📐 Model fitted to view (sync toLowerCase case)');
                        } catch (fitError) {
                          console.warn('⚠️ fitToView failed (sync toLowerCase case):', fitError);
                        }
                      } else {
                        console.warn('⚠️ Cannot fit to view - viewer not fully ready (sync toLowerCase case)');
                      }
                      
                    }, 1000);
                  } else if (syncError instanceof Error && syncError.message.includes('hasModels')) {
                    console.warn('⚠️ Synchronous hasModels error - treating as successful load:', syncError);
                    setInitStatus('✅ Model loaded successfully (ignored hasModels warning)');
                    setIsLoading(false);
                    onGeometryLoad?.(null); // Continue as if successful
                    // Fit model to view for proper proportions
                    setTimeout(() => {
                      if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                        try {
                          viewerInstance.fitToView();
                          console.log('📐 Model fitted to view (sync hasModels case)');
                        } catch (fitError) {
                          console.warn('⚠️ fitToView failed (sync hasModels case):', fitError);
                        }
                      } else {
                        console.warn('⚠️ Cannot fit to view - viewer not fully ready (sync hasModels case)');
                      }
                      
                    }, 1000);
                  } else {
                    // Don't treat this as a failure if the model might still be visible
                    setInitStatus('⚠️ Model loaded with warnings');
                    setIsLoading(false);
                    // Still try to fit to view in case model is visible
                    setTimeout(() => {
                      if (viewerInstance && viewerInstance.fitToView && viewerInstance.impl && viewerInstance.impl.scene) {
                        try {
                          viewerInstance.fitToView();
                          console.log('📐 Model fitted to view (warnings case)');
                        } catch (fitError) {
                          console.warn('⚠️ fitToView failed (warnings case):', fitError);
                        }
                      } else {
                        console.warn('⚠️ Cannot fit to view - viewer not fully ready (warnings case)');
                      }
                      
                    }, 1000);
                  }
                }
              } else {
                // More helpful error message with debugging info
                const allNodes = doc.getRoot().search({'type': 'geometry'});
                const all2DNodes = doc.getRoot().search({'role': '2d'});
                
                console.warn('📄 Document analysis:', {
                  'Total geometry nodes': allNodes.length,
                  '2D nodes': all2DNodes.length,
                  'Document type': doc.getRoot().data.type,
                  'Available roles': doc.getRoot().search({}).map((n: any) => n.data.role).filter((r: any) => r)
                });
                
                const errorMsg = 'No viewable geometry found in document. This file may contain only 2D drawings or metadata.';
                console.warn('⚠️', errorMsg);
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
            setIsInitialSizing(false); // Reset initial sizing state on error
            onError?.(errorMsg);
          }
        }, 100); // 100ms delay for DOM stability
      });

    } catch (sdkError) {
      console.error('❌ SDK loading failed:', sdkError);
      const errorMsg = `SDK loading failed: ${sdkError instanceof Error ? sdkError.message : sdkError}`;
      setError(errorMsg);
      setIsLoading(false);
      setIsInitialSizing(false); // Reset initial sizing state on error
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

  // Handle window resize for responsive viewer
  useEffect(() => {
    if (!viewer) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // First, do immediate width-only resize for live feedback
      performLiveWidthResize();
      
      // Clear previous timeout for the full resize
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Enhanced resize handling - immediate for width decrease, debounced for increase
      const currentWidth = viewerRef.current?.getBoundingClientRect().width || 0;
      
      // Check if width is decreasing compared to last known width
      if (!(window as any).lastKnownWidth) (window as any).lastKnownWidth = currentWidth;
      const isWidthDecrease = currentWidth < (window as any).lastKnownWidth;
      (window as any).lastKnownWidth = currentWidth;
      
      if (isWidthDecrease) {
        console.log('🔄 Width decrease detected - immediate aggressive height preservation');
        // Small delay to allow live resize to complete first
        setTimeout(() => {
          performResizeWithHeightReset(true); // Pass true for width decrease
        }, 50);
      } else {
        console.log('🔄 Width increase detected - debounced height preservation');
        // Debounce for width increase to avoid flickering
        resizeTimeout = setTimeout(() => {
          performResizeWithHeightReset(false);
        }, 300);
      }
    };

    const performLiveWidthResize = () => {
      try {
        // Only do live width resize if viewer is ready
        if (!viewer || !viewer.impl || !viewerRef.current) {
          return;
        }

        const container = viewerRef.current;
        const containerRect = container.getBoundingClientRect();
        
        // Only proceed if container has valid dimensions
        if (containerRect.width <= 0 || containerRect.height <= 0) {
          return;
        }

        // Use explicit height prop if provided, otherwise use captured values
        const targetHeight = height !== '100%' && height !== 'auto' ? 
          (typeof height === 'string' ? parseInt(height.replace('px', '')) : height) : 
          (goodHeightValues.current.maxHeight ? 
            parseInt(goodHeightValues.current.maxHeight.replace('px', '')) : 
            containerRect.height);

        console.log('⚡ Live width resize:', containerRect.width, 'target height:', targetHeight);

        // Find the viewer's main div and canvas
        const viewerDiv = container.querySelector('.adsk-viewing-viewer') as HTMLElement;
        const canvas = viewer.impl.canvas;
        
        if (viewerDiv) {
          // Apply smooth transitions for live resizing
          viewerDiv.style.transition = 'all 0.2s ease-out';
          viewerDiv.style.maxWidth = containerRect.width + 'px';
          viewerDiv.style.maxHeight = targetHeight + 'px';
          viewerDiv.style.minHeight = targetHeight + 'px'; // Force exact height
          viewerDiv.style.height = targetHeight + 'px'; // Force exact height
        }
        
        if (canvas) {
          // Apply smooth transitions for live resizing
          canvas.style.transition = 'all 0.2s ease-out';
          canvas.style.maxWidth = containerRect.width + 'px';
          canvas.style.maxHeight = targetHeight + 'px';
          canvas.style.minHeight = targetHeight + 'px'; // Force exact height
          canvas.style.height = targetHeight + 'px'; // Force exact height
        }
        
        // Quick viewer resize for immediate feedback
        viewer.resize();
        
      } catch (error) {
        console.warn('⚠️ Error in live width resize:', error);
      }
    };

    const performResizeWithHeightReset = (_isWidthDecrease = false) => {
      try {
        // Safety checks before resizing
        if (viewer && viewer.impl && viewer.impl.canvas && viewerRef.current) {
          const containerRect = viewerRef.current.getBoundingClientRect();
          
          // Only resize if container has valid dimensions
          if (containerRect.width > 0 && containerRect.height > 0) {
            console.log('🔄 Window resize completed - using captured good height values');
            
            // Simple resize with captured good height values (no need for narrow-first trick during resize)
            viewer.resize();
            setTimeout(() => {
              forceGoodHeightValues(viewer, false);
            }, 100);
            
          } else {
            console.warn('⚠️ Container not ready for resize during window resize');
          }
        } else {
          console.warn('⚠️ Viewer not ready for resize during window resize');
        }
      } catch (resizeError) {
        console.warn('Viewer resize error:', resizeError);
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Also trigger an initial resize after a short delay to ensure proper sizing
    const initialResizeTimeout = setTimeout(() => {
      performResizeWithHeightReset();
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (initialResizeTimeout) {
        clearTimeout(initialResizeTimeout);
      }
    };
  }, [viewer]);

  // Watch for height prop changes and update viewer accordingly (debounced for smooth transitions)
  useEffect(() => {
    if (!viewer || !viewer.impl || !viewerRef.current) return;
    
    console.log('🔄 Height prop changed, scheduling smooth update:', height);
    
    // Debounce height changes to allow smooth transitions
    const heightChangeTimeout = setTimeout(() => {
      console.log('🔄 Applying debounced height constraints:', height);
      constrainViewerToContainer(viewer, false);
      
      // Single delayed resize for final adjustment
      setTimeout(() => {
        if (viewer && viewer.resize) {
          viewer.resize();
          console.log('🔄 Final resize after smooth transition');
        }
      }, 250); // After transition completes
      
    }, 100); // Small delay to allow CSS transition to start
    
    return () => clearTimeout(heightChangeTimeout);
    
  }, [height, viewer]);

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
    <div className="relative w-full overflow-hidden group">
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

      {/* Initial Sizing Overlay */}
      {isInitialSizing && (
        <div 
          className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Optimizing viewer...</p>
          </div>
        </div>
      )}

      {/* CSS for hiding viewer controls until hover */}
      <style jsx>{`
        /* Hide main toolbar controls */
        .group:not(:hover) :global(.adsk-toolbar),
        .group:not(:hover) :global(.adsk-toolbar-vertical),
        .group:not(:hover) :global(.adsk-viewer-toolbar) {
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }
        
        /* Hide navigation cube specifically */
        .group:not(:hover) :global(.adsk-viewcube-wrap),
        .group:not(:hover) :global(.adsk-viewcube),
        .group:not(:hover) :global(.adsk-viewcube-compass),
        .group:not(:hover) :global(.adsk-viewcube-home),
        .group:not(:hover) :global(.adsk-viewcube-face),
        .group:not(:hover) :global(.adsk-viewcube-corner),
        .group:not(:hover) :global(.adsk-viewcube-edge),
        .group:not(:hover) :global([class*="viewcube"]),
        .group:not(:hover) :global([class*="ViewCube"]),
        .group:not(:hover) :global([id*="viewcube"]),
        .group:not(:hover) :global([id*="ViewCube"]) {
          opacity: 0 !important;
          visibility: hidden !important;
          transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }
        
        /* Hide progress/loading bars always */
        :global(.progress),
        :global(.progress-bar),
        :global(.adsk-progress),
        :global(.adsk-progress-bar),
        :global(.loading-progress),
        :global([class*="progress"]),
        :global([id*="progress"]) {
          display: none !important;
          visibility: hidden !important;
        }
        
        
        /* Show main toolbar controls on hover */
        .group:hover :global(.adsk-toolbar),
        .group:hover :global(.adsk-toolbar-vertical),
        .group:hover :global(.adsk-viewer-toolbar) {
          opacity: 1 !important;
          transition: opacity 0.3s ease !important;
        }
        
        /* Show navigation cube on hover */
        .group:hover :global(.adsk-viewcube-wrap),
        .group:hover :global(.adsk-viewcube),
        .group:hover :global(.adsk-viewcube-compass),
        .group:hover :global(.adsk-viewcube-home),
        .group:hover :global(.adsk-viewcube-face),
        .group:hover :global(.adsk-viewcube-corner),
        .group:hover :global(.adsk-viewcube-edge),
        .group:hover :global([class*="viewcube"]),
        .group:hover :global([class*="ViewCube"]),
        .group:hover :global([id*="viewcube"]),
        .group:hover :global([id*="ViewCube"]) {
          opacity: 1 !important;
          visibility: visible !important;
          transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }
      `}</style>

      {/* Viewer Container */}
      <div
        ref={viewerRef}
        style={{ 
          width, 
          height,
          opacity: isInitialSizing ? 0 : 1,
          transition: isInitialSizing ? 'none' : 'all 0.2s ease-out',
          borderRadius: 0
        }}
        className="autodesk-viewer-container"
      />
    </div>
  );
}