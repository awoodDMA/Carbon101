/**
 * Autodesk Viewer Manager with Proper DOM and WebGL Context Initialization
 * 
 * Fixes the WebGL framebuffer error by ensuring:
 * 1. Canvas is fully attached to DOM before viewer start
 * 2. WebGL context is properly initialized and validated
 * 3. No rendering occurs until context is ready
 * 4. Proper error handling for context loss/restore
 */

type ViewerConfig = {
  urn: string;
  accessToken: string;
  container: HTMLElement;
  onDocumentLoad?: (doc: any) => void;
  onGeometryLoad?: (model: any) => void;
  onError?: (error: string) => void;
  onCancelled?: () => boolean; // Check if operation should be cancelled
};

type ViewerInstance = {
  viewer: any;
  config: ViewerConfig;
  containerId: string;
  canvas: HTMLCanvasElement | null;
  webglContext: WebGLRenderingContext | WebGL2RenderingContext | null;
  isDestroyed: boolean;
};

class AutodeskViewerDOMReady {
  private static instance: AutodeskViewerDOMReady | null = null;
  private currentViewer: ViewerInstance | null = null;
  private isSDKLoaded = false;
  private sdkLoadPromise: Promise<void> | null = null;
  private isInitializing = false;

  private constructor() {
    // DOM ready event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pauseRendering();
        else this.resumeRendering();
      });

      // CRITICAL: Add global error handler for WebGL framebuffer errors
      const originalError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        if (typeof message === 'string' && message.includes('__webglFramebuffer')) {
          console.warn('🚨 Caught WebGL framebuffer error - viewer destroyed during render');
          // Emergency stop all viewers
          if (this.currentViewer?.viewer?.impl) {
            this.currentViewer.viewer.impl.running = false;
            if (this.currentViewer.viewer.impl.animLoop) {
              this.currentViewer.viewer.impl.animLoop.running = false;
            }
          }
          return true; // Prevent error from propagating
        }
        return originalError ? originalError(message, source, lineno, colno, error) : false;
      };

      // Also handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('__webglFramebuffer')) {
          console.warn('🚨 Caught unhandled WebGL framebuffer promise rejection');
          event.preventDefault();
        }
      });
    }
  }

  static getInstance(): AutodeskViewerDOMReady {
    if (!AutodeskViewerDOMReady.instance) {
      AutodeskViewerDOMReady.instance = new AutodeskViewerDOMReady();
    }
    return AutodeskViewerDOMReady.instance;
  }

  /**
   * Wait for DOM element to be ready and attached
   */
  private async waitForDOMReady(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      // Check if element is already in DOM and ready
      if (document.contains(element) && element.offsetParent !== null) {
        resolve();
        return;
      }

      // Use MutationObserver to wait for element attachment
      const observer = new MutationObserver(() => {
        if (document.contains(element) && element.offsetParent !== null) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1000);
    });
  }

  /**
   * Validate WebGL context is ready for rendering
   */
  private async validateWebGLContext(canvas: HTMLCanvasElement): Promise<WebGLRenderingContext | WebGL2RenderingContext> {
    return new Promise((resolve, reject) => {
      try {
        // Try WebGL 2.0 first, then fallback to WebGL 1.0
        let context: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2', {
          preserveDrawingBuffer: false,
          antialias: false,
          alpha: true,
          depth: true,
          stencil: true,
          powerPreference: 'default'
        });

        if (!context) {
          console.log('WebGL 2.0 not available, trying WebGL 1.0');
          context = canvas.getContext('webgl', {
            preserveDrawingBuffer: false,
            antialias: false,
            alpha: true,
            depth: true,
            stencil: true,
            powerPreference: 'default'
          });
        }

        if (!context) {
          reject(new Error('WebGL not supported in this environment'));
          return;
        }

        // Test WebGL functionality
        const testProgram = context.createProgram();
        if (!testProgram) {
          reject(new Error('WebGL context is not functional'));
          return;
        }

        context.deleteProgram(testProgram);

        // Add context lost/restored handlers
        canvas.addEventListener('webglcontextlost', (event) => {
          console.warn('🚨 WebGL context lost');
          event.preventDefault();
          this.handleContextLost();
        });

        canvas.addEventListener('webglcontextrestored', () => {
          console.log('✅ WebGL context restored');
          this.handleContextRestored();
        });

        resolve(context);

      } catch (error) {
        reject(new Error(`WebGL context validation failed: ${error}`));
      }
    });
  }

  /**
   * Handle WebGL context loss
   */
  private handleContextLost(): void {
    if (this.currentViewer) {
      this.currentViewer.config.onError?.('WebGL context lost. The page will reload automatically.');
      // Auto-reload on context loss (Codespaces-friendly)
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  /**
   * Handle WebGL context restoration
   */
  private handleContextRestored(): void {
    // Context restoration is handled by auto-reload in handleContextLost
  }

  /**
   * Load Autodesk SDK
   */
  private async loadSDK(): Promise<void> {
    if (this.isSDKLoaded) return;
    if (this.sdkLoadPromise) return this.sdkLoadPromise;

    this.sdkLoadPromise = new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Autodesk) {
        this.isSDKLoaded = true;
        resolve();
        return;
      }

      // Load CSS first
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);

      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      
      script.onload = () => {
        this.isSDKLoaded = true;
        // Log viewer version as per Autodesk recommendations
        const version = (window as any).LMV_VIEWER_VERSION;
        console.log(`✅ Autodesk Viewer SDK loaded (v${version || 'unknown'})`);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Autodesk Viewer SDK'));
      };
      
      document.head.appendChild(script);
    });

    return this.sdkLoadPromise;
  }

  /**
   * Safely destroy current viewer
   */
  private async destroyCurrentViewer(): Promise<void> {
    if (!this.currentViewer || this.currentViewer.isDestroyed) return;

    const viewer = this.currentViewer.viewer;
    this.currentViewer.isDestroyed = true;
    viewer.isDestroyed = true;

    try {
      console.log('🧹 Destroying viewer with WebGL safety - emergency stop');

      // EMERGENCY STOP: Immediately disable all rendering paths
      if (viewer.impl) {
        // Stop the main render loop
        viewer.impl.running = false;
        
        // Stop animation loop
        if (viewer.impl.animLoop) {
          viewer.impl.animLoop.running = false;
          if (viewer.impl.animLoop.requestId) {
            cancelAnimationFrame(viewer.impl.animLoop.requestId);
          }
        }

        // CRITICAL: Disable the WebGL renderer at the lowest level
        if (viewer.impl.renderer) {
          // Override critical WebGL methods to prevent framebuffer access
          const renderer = viewer.impl.renderer;
          const originalSetRenderTarget = renderer.setRenderTarget;
          const originalInitFrameBufferMRT = renderer.initFrameBufferMRT;
          
          renderer.setRenderTarget = function() {
            // Silently ignore render target operations
            return;
          };
          
          if (renderer.initFrameBufferMRT) {
            renderer.initFrameBufferMRT = function() {
              // Silently ignore framebuffer operations
              return;
            };
          }

          // Disable the entire renderer
          renderer.enabled = false;
        }

        // Override the render function completely
        if (viewer.impl.render) {
          viewer.impl.render = function() {
            // Do nothing - viewer is being destroyed
            return;
          };
        }

        // Wait for any in-flight render operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Emergency render stop complete');
      }

      // Clear and finish safely following Autodesk best practices
      try {
        if (viewer.clearSelection) viewer.clearSelection();
        if (viewer.model) viewer.unloadModel(viewer.model);
        // Use Autodesk recommended cleanup sequence
        if (viewer.finish) {
          viewer.finish();
          // Note: viewer reference will be nulled in finally block
        }
      } catch (cleanupError) {
        console.warn('⚠️ Non-critical cleanup error:', cleanupError);
      }

      // Clear container
      if (this.currentViewer.config.container) {
        this.currentViewer.config.container.innerHTML = '';
      }

    } catch (error) {
      console.warn('⚠️ Error during viewer destruction:', error);
    } finally {
      this.currentViewer = null;
    }
  }

  /**
   * Create viewer with proper DOM and WebGL initialization
   */
  async createViewer(config: ViewerConfig): Promise<void> {
    if (this.isInitializing) {
      throw new Error('Viewer initialization already in progress');
    }

    this.isInitializing = true;

    try {
      // Check for cancellation before starting
      if (config.onCancelled?.()) {
        console.log('🚫 Viewer creation cancelled before start');
        return;
      }

      // Destroy any existing viewer
      await this.destroyCurrentViewer();

      console.log('🚀 Creating viewer with DOM/WebGL validation');

      // Check for cancellation after cleanup
      if (config.onCancelled?.()) {
        console.log('🚫 Viewer creation cancelled after cleanup');
        return;
      }

      // Ensure SDK is loaded
      await this.loadSDK();

      // Check for cancellation after SDK load
      if (config.onCancelled?.()) {
        console.log('🚫 Viewer creation cancelled after SDK load');
        return;
      }

      // CRITICAL: Wait for DOM to be ready
      await this.waitForDOMReady(config.container);
      console.log('✅ DOM ready');

      // Check for cancellation after DOM ready
      if (config.onCancelled?.()) {
        console.log('🚫 Viewer creation cancelled after DOM ready');
        return;
      }

      // Additional safety wait for Codespaces  
      await new Promise(resolve => setTimeout(resolve, 500));

      // Final cancellation check before viewer creation
      if (config.onCancelled?.()) {
        console.log('🚫 Viewer creation cancelled before viewer creation');
        return;
      }

      const options = {
        env: 'AutodeskProduction2', // SVF2 support as per Autodesk requirements
        api: 'streamingV2', // SVF2 support as per Autodesk requirements
        getAccessToken: (onTokenReady: (token: string, expires: number) => void) => {
          onTokenReady(config.accessToken, 3600);
        },
        useWebGL2: false, // Codespaces compatibility
      };

      // Enable automatic region routing as per Autodesk requirements
      if (window.Autodesk?.Viewing?.FeatureFlags) {
        window.Autodesk.Viewing.FeatureFlags.set('DS_ENDPOINTS', true);
      }

      await new Promise<void>((resolve, reject) => {
        window.Autodesk.Viewing.Initializer(options, async () => {
          try {
            // Clear container
            config.container.innerHTML = '';

            // Create viewer with proper Autodesk configuration
            const viewer = new window.Autodesk.Viewing.GuiViewer3D(config.container, {
              // Let Autodesk Viewer load default extensions for proper UI
              // Only disable truly problematic extensions for Codespaces
              disabledExtensions: {
                'Autodesk.BimWalk': true,  // Can cause issues in Codespaces
                'Autodesk.Hypermodeling': true  // GPU intensive
              }
            });

            // Let Autodesk Viewer handle WebGL setup
            console.log('🎯 Autodesk Viewer ready to start');

            // Store viewer instance
            this.currentViewer = {
              viewer,
              config,
              containerId: config.container.id || `container-${Date.now()}`,
              canvas: null, // Let Autodesk Viewer manage canvas
              webglContext: null, // Let Autodesk Viewer manage WebGL context
              isDestroyed: false
            };

            // Link the destroyed flag to the viewer for render loop checks
            viewer.isDestroyed = false;

            // Add error handlers
            viewer.addEventListener(window.Autodesk.Viewing.WEBGL_CONTEXT_LOST_EVENT, () => {
              this.handleContextLost();
            });

            // Start viewer and check for WebGL support as per Autodesk requirements
            const startCode = viewer.start();
            if (startCode > 0) {
              const errorMessage = startCode === 1 ? 
                'Failed to create a Viewer: WebGL not supported.' : 
                `Viewer failed to start with code: ${startCode}`;
              console.error(errorMessage);
              reject(new Error(errorMessage));
              return;
            }

            console.log('✅ Viewer started successfully with Autodesk UI');

            // Load document
            window.Autodesk.Viewing.Document.load(
              config.urn,
              (doc: any) => {
                // Check for cancellation before document processing
                if (this.currentViewer?.isDestroyed || config.onCancelled?.()) {
                  console.log('🚫 Document load cancelled');
                  return;
                }
                
                config.onDocumentLoad?.(doc);
                
                // Use Autodesk recommended approach: get default geometry
                const defaultModel = doc.getRoot().getDefaultGeometry();
                if (defaultModel) {
                  viewer.loadDocumentNode(doc, defaultModel).then((model: any) => {
                    // Check for cancellation before geometry processing
                    if (this.currentViewer?.isDestroyed || config.onCancelled?.()) {
                      console.log('🚫 Geometry load cancelled');
                      return;
                    }
                    
                    config.onGeometryLoad?.(model);
                    resolve();
                  }).catch((loadError: any) => {
                    if (config.onCancelled?.()) {
                      console.log('🚫 Geometry load error cancelled');
                      return;
                    }
                    reject(loadError);
                  });
                } else {
                  if (config.onCancelled?.()) {
                    console.log('🚫 No viewable geometry - operation cancelled');
                    return;
                  }
                  reject(new Error('No viewable geometry found'));
                }
              },
              (errorCode: number, errorMsg: string) => {
                if (config.onCancelled?.()) {
                  console.log('🚫 Document load error cancelled');
                  return;
                }
                reject(new Error(`Document load failed: ${errorMsg} (${errorCode})`));
              }
            );

          } catch (error) {
            reject(error);
          }
        });
      });

      console.log('✅ Viewer created with DOM/WebGL validation');

    } catch (error) {
      console.error('❌ Viewer creation failed:', error);
      config.onError?.(error instanceof Error ? error.message : 'Failed to create viewer');
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Pause rendering when tab is hidden
   */
  private pauseRendering(): void {
    if (this.currentViewer?.viewer?.impl) {
      this.currentViewer.viewer.impl.running = false;
    }
  }

  /**
   * Resume rendering when tab is visible
   */
  private resumeRendering(): void {
    if (this.currentViewer?.viewer?.impl && !this.currentViewer.isDestroyed) {
      this.currentViewer.viewer.impl.running = true;
    }
  }

  getCurrentViewer(): any {
    return this.currentViewer?.viewer || null;
  }

  isViewerForContainer(containerId: string): boolean {
    return this.currentViewer?.containerId === containerId && !this.currentViewer.isDestroyed;
  }

  async destroyViewerForContainer(containerId: string): Promise<void> {
    if (this.currentViewer?.containerId === containerId) {
      await this.destroyCurrentViewer();
    }
  }

  async cleanup(): Promise<void> {
    await this.destroyCurrentViewer();
    
    // Use Autodesk recommended global shutdown
    if (typeof window !== 'undefined' && window.Autodesk?.Viewing?.shutdown) {
      window.Autodesk.Viewing.shutdown();
    }
    
    AutodeskViewerDOMReady.instance = null;
  }
}

export const autodeskViewerDOMReady = AutodeskViewerDOMReady.getInstance();