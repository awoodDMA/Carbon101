/**
 * Final WebGL Framebuffer Fix - Aggressive Render Loop Control
 * 
 * The error occurs because:
 * 1. The viewer's render loop (_animLoop) continues running after WebGL context destruction
 * 2. initFrameBufferMRT tries to access null __webglFramebuffer
 * 3. This happens in the render pipeline: _animLoop → _mainLoop → _render → setRenderTarget → initFrameBufferMRT
 * 
 * Solution: Completely stop all render operations before any context changes
 */

type ViewerConfig = {
  urn: string;
  accessToken: string;
  container: HTMLElement;
  onDocumentLoad?: (doc: any) => void;
  onGeometryLoad?: (model: any) => void;
  onError?: (error: string) => void;
};

type ViewerInstance = {
  viewer: any;
  config: ViewerConfig;
  containerId: string;
  animationId: number | null;
  isDestroyed: boolean;
};

class AutodeskViewerManagerFinal {
  private static instance: AutodeskViewerManagerFinal | null = null;
  private currentViewer: ViewerInstance | null = null;
  private isSDKLoaded = false;
  private sdkLoadPromise: Promise<void> | null = null;
  private isInitializing = false;
  private isDestroying = false;
  private globalAnimationFrame: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Aggressive cleanup on any navigation
      const cleanup = () => this.emergencyCleanup();
      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('pagehide', cleanup);
      window.addEventListener('popstate', cleanup);
      
      // Stop render loops on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.currentViewer) {
          this.stopAllRenderLoops();
        }
      });
    }
  }

  static getInstance(): AutodeskViewerManagerFinal {
    if (!AutodeskViewerManagerFinal.instance) {
      AutodeskViewerManagerFinal.instance = new AutodeskViewerManagerFinal();
    }
    return AutodeskViewerManagerFinal.instance;
  }

  /**
   * Emergency cleanup - stop everything immediately
   */
  private emergencyCleanup(): void {
    console.log('🚨 Emergency cleanup initiated');
    
    // Stop all animation frames immediately
    this.stopAllRenderLoops();
    
    // Force destroy current viewer
    if (this.currentViewer && !this.currentViewer.isDestroyed) {
      this.forceDestroyViewer();
    }
  }

  /**
   * Stop all render loops to prevent WebGL access
   */
  private stopAllRenderLoops(): void {
    if (this.globalAnimationFrame) {
      cancelAnimationFrame(this.globalAnimationFrame);
      this.globalAnimationFrame = null;
    }

    if (this.currentViewer?.animationId) {
      cancelAnimationFrame(this.currentViewer.animationId);
      this.currentViewer.animationId = null;
    }

    if (this.currentViewer?.viewer) {
      const viewer = this.currentViewer.viewer;
      
      // Stop the main render loop
      if (viewer.impl?.running) {
        viewer.impl.running = false;
      }

      // Stop animation service
      if (viewer.impl?.animLoop) {
        viewer.impl.animLoop.running = false;
      }

      // Stop rendering service
      if (viewer.impl?.renderingService) {
        viewer.impl.renderingService.running = false;
      }

      // Disable any pending renders
      if (viewer.impl?.invalidateId) {
        clearTimeout(viewer.impl.invalidateId);
        viewer.impl.invalidateId = null;
      }
    }
  }

  /**
   * Force destroy viewer without cleanup delays
   */
  private forceDestroyViewer(): void {
    if (!this.currentViewer) return;

    const viewer = this.currentViewer.viewer;
    this.currentViewer.isDestroyed = true;

    try {
      // 1. STOP ALL RENDERING FIRST
      this.stopAllRenderLoops();

      // 2. Wait for any pending render to complete
      if (viewer.impl?.glrenderer?.context) {
        const gl = viewer.impl.glrenderer.context;
        gl.finish(); // Wait for all GL commands to complete
      }

      // 3. Clear WebGL state safely
      if (viewer.impl?.glrenderer) {
        const renderer = viewer.impl.glrenderer;
        
        // Unbind all framebuffers
        if (renderer.context) {
          renderer.context.bindFramebuffer(renderer.context.FRAMEBUFFER, null);
        }
        
        // Dispose renderer
        if (renderer.dispose) {
          renderer.dispose();
        }
      }

      // 4. Clear all other resources
      if (viewer.clearSelection) viewer.clearSelection();
      if (viewer.model) viewer.unloadModel(viewer.model);
      if (viewer.removeEventListener) viewer.removeEventListener();
      if (viewer.finish) viewer.finish();

      // 5. Clear container
      if (this.currentViewer.config.container) {
        this.currentViewer.config.container.innerHTML = '';
      }

    } catch (error) {
      console.warn('⚠️ Error in force destroy:', error);
    } finally {
      this.currentViewer = null;
    }
  }

  /**
   * Load SDK
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

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      
      script.onload = () => {
        this.isSDKLoaded = true;
        resolve();
      };
      
      script.onerror = () => reject(new Error('Failed to load SDK'));
      
      document.head.appendChild(script);
    });

    return this.sdkLoadPromise;
  }

  /**
   * Safe destroy with render loop control
   */
  private async safeDestroyViewer(): Promise<void> {
    if (!this.currentViewer || this.isDestroying || this.currentViewer.isDestroyed) {
      return;
    }

    this.isDestroying = true;
    const viewer = this.currentViewer.viewer;

    console.log('🛑 Safe viewer destruction starting');

    try {
      // CRITICAL: Stop all render loops BEFORE any destruction
      this.stopAllRenderLoops();

      // Wait for current frame to complete
      await new Promise(resolve => {
        if (this.globalAnimationFrame) {
          cancelAnimationFrame(this.globalAnimationFrame);
        }
        this.globalAnimationFrame = requestAnimationFrame(() => {
          resolve(undefined);
        });
      });

      // Mark as destroyed to prevent any callbacks
      this.currentViewer.isDestroyed = true;

      // Now safe to destroy WebGL resources
      if (viewer.impl?.glrenderer?.context) {
        const gl = viewer.impl.glrenderer.context;
        
        // Ensure no framebuffer is bound
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.finish();
      }

      // Standard cleanup
      if (viewer.clearSelection) viewer.clearSelection();
      if (viewer.model) viewer.unloadModel(viewer.model);
      if (viewer.removeEventListener) viewer.removeEventListener();
      
      // Dispose renderer after stopping loops
      if (viewer.impl?.glrenderer?.dispose) {
        viewer.impl.glrenderer.dispose();
      }
      
      if (viewer.finish) viewer.finish();

      // Clear container
      if (this.currentViewer.config.container) {
        this.currentViewer.config.container.innerHTML = '';
      }

      console.log('✅ Viewer destroyed safely');

    } catch (error) {
      console.warn('⚠️ Error during safe destruction:', error);
    } finally {
      this.currentViewer = null;
      this.isDestroying = false;
    }
  }

  /**
   * Create viewer with render loop monitoring
   */
  async createViewer(config: ViewerConfig): Promise<void> {
    if (this.isInitializing) {
      throw new Error('Viewer initialization in progress');
    }

    this.isInitializing = true;

    try {
      // Always destroy existing viewer first
      await this.safeDestroyViewer();

      console.log('🚀 Creating viewer with render loop protection');

      await this.loadSDK();

      // Additional safety wait
      await new Promise(resolve => setTimeout(resolve, 200));

      const options = {
        env: 'AutodeskProduction2',
        getAccessToken: (onTokenReady: (token: string, expires: number) => void) => {
          onTokenReady(config.accessToken, 3600);
        },
        api: 'streamingV2',
        useWebGL2: false, // Force WebGL 1.0 for better stability
        webGLHelpersEnabled: true,
      };

      await new Promise<void>((resolve, reject) => {
        window.Autodesk.Viewing.Initializer(options, () => {
          try {
            config.container.innerHTML = '';

            const viewer = new window.Autodesk.Viewing.GuiViewer3D(config.container, {
              extensions: [],
              // Disable features that use framebuffers
              disabledExtensions: {
                hypermodeling: true,
                bimwalk: true,
                pushpins: true,
                section: true, // Section planes use framebuffers
                explode: true
              }
            });

            // Critical error handlers
            viewer.addEventListener(window.Autodesk.Viewing.WEBGL_CONTEXT_LOST_EVENT, () => {
              console.error('❌ WebGL context lost - stopping all operations');
              this.emergencyCleanup();
              config.onError?.('WebGL context lost. Please refresh the page.');
            });

            const startCode = viewer.start();
            if (startCode > 0) {
              reject(new Error(`Viewer start failed: ${startCode}`));
              return;
            }

            // Store viewer with monitoring
            this.currentViewer = {
              viewer,
              config,
              containerId: config.container.id || `container-${Date.now()}`,
              animationId: null,
              isDestroyed: false
            };

            // Load document
            window.Autodesk.Viewing.Document.load(
              config.urn,
              (doc: any) => {
                if (this.currentViewer?.isDestroyed) return;
                
                config.onDocumentLoad?.(doc);
                
                const viewables = doc.getRoot().getDefaultGeometry();
                if (viewables) {
                  viewer.loadDocumentNode(doc, viewables).then((model: any) => {
                    if (this.currentViewer?.isDestroyed) return;
                    
                    config.onGeometryLoad?.(model);
                    resolve();
                  }).catch(reject);
                } else {
                  reject(new Error('No viewable geometry found'));
                }
              },
              (errorCode: number, errorMsg: string) => {
                reject(new Error(`Document load failed: ${errorMsg} (${errorCode})`));
              }
            );

          } catch (error) {
            reject(error);
          }
        });
      });

      console.log('✅ Viewer created with protection');

    } catch (error) {
      console.error('❌ Viewer creation failed:', error);
      config.onError?.(error instanceof Error ? error.message : 'Failed to create viewer');
      throw error;
    } finally {
      this.isInitializing = false;
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
      await this.safeDestroyViewer();
    }
  }

  async cleanup(): Promise<void> {
    this.emergencyCleanup();
    AutodeskViewerManagerFinal.instance = null;
  }
}

export const autodeskViewerManagerFinal = AutodeskViewerManagerFinal.getInstance();