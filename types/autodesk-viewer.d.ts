/**
 * Autodesk Viewer TypeScript Declarations
 * Based on official Autodesk documentation
 */

declare global {
  interface Window {
    Autodesk: {
      Viewing: {
        Initializer: (options: any, callback: () => void) => void;
        Document: {
          load: (
            urn: string,
            onLoadSuccess: (doc: any) => void,
            onLoadFailure: (errorCode: number, errorMsg: string) => void
          ) => void;
        };
        GuiViewer3D: new (container: HTMLElement, config?: any) => any;
        shutdown: () => void;
        FeatureFlags: {
          set: (flag: string, value: boolean) => void;
        };
        WEBGL_CONTEXT_LOST_EVENT: string;
      };
    };
    LMV_VIEWER_VERSION?: string;
  }
}

export {};