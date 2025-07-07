/**
 * Autodesk Viewer Manager - Singleton Pattern
 * 
 * This solves the WebGL framebuffer error by ensuring:
 * 1. Only ONE viewer instance exists at any time
 * 2. Proper cleanup before creating new instances
 * 3. Global state management to prevent race conditions
 * 4. Centralized WebGL resource management
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
};

class AutodeskViewerManager {
  private static instance: AutodeskViewerManager | null = null;
  private currentViewer: ViewerInstance | null = null;
  private isSDKLoaded = false;
  private sdkLoadPromise: Promise<void> | null = null;
  private isInitializing = false;
  private isDestroying = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AutodeskViewerManager {
    if (!AutodeskViewerManager.instance) {
      AutodeskViewerManager.instance = new AutodeskViewerManager();
    }
    return AutodeskViewerManager.instance;
  }

  /**
   * Load Autodesk Viewer SDK once globally
   */
  private async loadSDK(): Promise<void> {
    if (this.isSDKLoaded) return;
    
    if (this.sdkLoadPromise) return this.sdkLoadPromise;

    this.sdkLoadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window !== 'undefined' && window.Autodesk) {
        this.isSDKLoaded = true;
        resolve();
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);

      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      
      script.onload = () => {
        this.isSDKLoaded = true;
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
   * Completely destroy current viewer and clean up WebGL resources
   */
  private async destroyCurrentViewer(): Promise<void> {
    if (!this.currentViewer || this.isDestroying) return;

    this.isDestroying = true;
    const viewer = this.currentViewer.viewer;

    console.log('🧹 ViewerManager: Destroying current viewer');

    try {
      // Stop render loops FIRST
      if (viewer.impl?.renderingService?.running) {
        viewer.impl.renderingService.stop();
      }

      // Stop animation loops
      if (viewer.impl?.animLoop) {
        viewer.impl.animLoop.running = false;
      }

      // Clear any models
      if (viewer.model) {
        viewer.unloadModel(viewer.model);
      }

      // Force WebGL cleanup
      if (viewer.impl?.glrenderer) {
        const gl = viewer.impl.glrenderer.context;
        if (gl) {
          // Clear all framebuffers before disposal
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.flush();
        }
        
        if (viewer.impl.glrenderer.dispose) {
          viewer.impl.glrenderer.dispose();
        }
      }

      // Remove all event listeners
      viewer.removeEventListener?.();

      // Finish viewer
      viewer.finish();

      // Clear container
      const container = this.currentViewer.config.container;
      if (container) {
        container.innerHTML = '';
      }

      console.log('✅ ViewerManager: Viewer destroyed successfully');

    } catch (error) {
      console.warn('⚠️ ViewerManager: Error during destruction:', error);
    } finally {
      this.currentViewer = null;
      this.isDestroying = false;
    }
  }

  /**
   * Create new viewer instance with proper WebGL management
   */
  async createViewer(config: ViewerConfig): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      throw new Error('Viewer initialization already in progress');
    }

    this.isInitializing = true;

    try {
      // Ensure SDK is loaded
      await this.loadSDK();

      // Destroy any existing viewer first
      await this.destroyCurrentViewer();

      console.log('🚀 ViewerManager: Creating new viewer');

      // Wait a frame to ensure WebGL context is clear
      await new Promise(resolve => requestAnimationFrame(resolve));

      const options = {
        env: 'AutodeskProduction2',
        getAccessToken: (onTokenReady: (token: string, expires: number) => void) => {
          onTokenReady(config.accessToken, 3600);
        },
        api: 'streamingV2',
      };

      await new Promise<void>((resolve, reject) => {
        window.Autodesk.Viewing.Initializer(options, () => {
          // Clear container completely
          config.container.innerHTML = '';

          // Create viewer with minimal extensions to reduce WebGL load
          const viewer = new window.Autodesk.Viewing.GuiViewer3D(config.container, {
            extensions: [] // No extensions to minimize WebGL usage
          });

          // Add error handlers
          viewer.addEventListener(window.Autodesk.Viewing.WEBGL_CONTEXT_LOST_EVENT, () => {
            console.error('❌ WebGL context lost');
            config.onError?.('WebGL context lost. Please refresh the page.');
          });

          const startCode = viewer.start();
          if (startCode > 0) {
            reject(new Error(`Viewer failed to start: ${startCode}`));
            return;
          }

          // Store viewer instance
          this.currentViewer = {
            viewer,
            config,
            containerId: config.container.id || 'unknown'
          };

          // Load document
          window.Autodesk.Viewing.Document.load(
            config.urn,
            (doc: any) => {
              config.onDocumentLoad?.(doc);
              
              const viewables = doc.getRoot().getDefaultGeometry();
              if (viewables) {
                viewer.loadDocumentNode(doc, viewables).then((model: any) => {
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
        });
      });

      console.log('✅ ViewerManager: Viewer created successfully');

    } catch (error) {
      console.error('❌ ViewerManager: Failed to create viewer:', error);
      config.onError?.(error instanceof Error ? error.message : 'Failed to create viewer');
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get current viewer instance
   */
  getCurrentViewer(): any {
    return this.currentViewer?.viewer || null;
  }

  /**
   * Check if viewer is for specific container
   */
  isViewerForContainer(containerId: string): boolean {
    return this.currentViewer?.containerId === containerId;
  }

  /**
   * Destroy viewer if it belongs to specific container
   */
  async destroyViewerForContainer(containerId: string): Promise<void> {
    if (this.currentViewer?.containerId === containerId) {
      await this.destroyCurrentViewer();
    }
  }

  /**
   * Global cleanup - call this on app shutdown
   */
  async cleanup(): Promise<void> {
    await this.destroyCurrentViewer();
    AutodeskViewerManager.instance = null;
  }
}

// Export singleton instance
export const autodeskViewerManager = AutodeskViewerManager.getInstance();

// Global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    autodeskViewerManager.cleanup();
  });
}