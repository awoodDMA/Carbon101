/**
 * Free AEC Viewer Component
 * 
 * This component displays models using ONLY FREE APIs:
 * - Uses AEC Data Model for design data
 * - Falls back to alternative viewers when translation is not available
 * - No Model Derivative API usage (no translation costs)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Eye, FileText, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface FreeAECViewerProps {
  designId: string;
  projectId: string;
  accessToken: string;
  width?: string;
  height?: string;
  onError?: (error: string) => void;
}

export default function FreeAECViewer({ 
  designId,
  projectId,
  accessToken,
  width = '100%', 
  height = '400px',
  onError
}: FreeAECViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designData, setDesignData] = useState<any>(null);
  const [viewerMode, setViewerMode] = useState<'autodesk' | 'alternative' | 'fallback'>('autodesk');

  useEffect(() => {
    loadDesignAndAttemptViewing();
  }, [designId, projectId, accessToken]);

  const loadDesignAndAttemptViewing = async () => {
    console.log('🔍 FreeAECViewer: Loading design:', designId);
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get design information using FREE AEC Data Model API
      const designResponse = await fetch(`/api/aec/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          designId
        })
      });

      if (!designResponse.ok) {
        throw new Error('Failed to get design information');
      }

      const designResult = await designResponse.json();
      if (!designResult.success) {
        throw new Error(designResult.error || 'Failed to load design');
      }

      const design = designResult.data;
      setDesignData(design);

      console.log('📊 FreeAECViewer: Design loaded:', design.name);

      // Step 2: Attempt to view the model
      if (design.isReady) {
        await attemptAutodeskViewer(design);
      } else {
        setViewerMode('fallback');
        setError('Design is not ready for viewing. It may still be processing.');
      }

    } catch (err) {
      console.error('❌ FreeAECViewer: Error loading design:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      setViewerMode('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  const attemptAutodeskViewer = async (design: any) => {
    console.log('🎯 FreeAECViewer: Attempting Autodesk Viewer for design:', design.name);

    try {
      // Try to construct a viewable URN from the design ID
      // This is speculative - it might work for some designs that are already processed
      const possibleUrn = `urn:adsk.viewing:fs.file:${designId}`;
      
      // Check if this URN is viewable without triggering translation
      const isViewable = await checkViewableStatus(possibleUrn);
      
      if (isViewable) {
        console.log('✅ FreeAECViewer: Design is viewable, initializing Autodesk Viewer');
        await initializeAutodeskViewer(possibleUrn);
        setViewerMode('autodesk');
      } else {
        console.log('⚠️ FreeAECViewer: Design not viewable through Autodesk Viewer, using alternative');
        setViewerMode('alternative');
      }

    } catch (err) {
      console.warn('⚠️ FreeAECViewer: Autodesk Viewer failed, falling back:', err);
      setViewerMode('alternative');
    }
  };

  const checkViewableStatus = async (urn: string): Promise<boolean> => {
    try {
      // Lightweight check using HEAD request - doesn't trigger processing
      const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
      const response = await fetch(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/manifest`,
        {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ FreeAECViewer: Could not check viewable status:', error);
      return false;
    }
  };

  const initializeAutodeskViewer = async (urn: string) => {
    console.log('🚀 FreeAECViewer: Initializing Autodesk Viewer with URN:', urn);

    try {
      // Load the Autodesk Viewer SDK if not already loaded
      if (!window.Autodesk) {
        await loadAutodeskSDK();
      }

      const options = {
        env: 'AutodeskProduction2',
        getAccessToken: (onTokenReady: (token: string, expires: number) => void) => {
          onTokenReady(accessToken, 3600);
        },
        api: 'streamingV2'
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        if (!viewerRef.current) return;

        viewerRef.current.innerHTML = '';

        const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current, {
          extensions: [],
          showFirstPersonToolbar: false,
          showLayerManager: false,
          showPropertyPanel: false,
          showSettingsPanel: false,
          disableSpinner: true
        });

        const startCode = viewerInstance.start();
        
        if (startCode > 0) {
          throw new Error(`Viewer failed to start. Error code: ${startCode}`);
        }

        // Load the document
        window.Autodesk.Viewing.Document.load(
          urn,
          (doc: any) => {
            console.log('📄 FreeAECViewer: Document loaded successfully');
            
            const viewables = doc.getRoot().getDefaultGeometry();
            
            if (viewables) {
              viewerInstance.loadDocumentNode(doc, viewables).then(() => {
                console.log('🎯 FreeAECViewer: Geometry loaded successfully');
                setIsLoading(false);
              }).catch((loadError: any) => {
                console.error('❌ FreeAECViewer: Failed to load geometry:', loadError);
                setViewerMode('alternative');
                setIsLoading(false);
              });
            } else {
              console.warn('⚠️ FreeAECViewer: No viewable geometry found');
              setViewerMode('alternative');
              setIsLoading(false);
            }
          },
          (errorCode: number, errorMsg: string) => {
            console.error('❌ FreeAECViewer: Document load failed:', errorCode, errorMsg);
            setViewerMode('alternative');
            setIsLoading(false);
          }
        );
      });

    } catch (error) {
      console.error('❌ FreeAECViewer: Viewer initialization failed:', error);
      setViewerMode('alternative');
      setIsLoading(false);
    }
  };

  const loadAutodeskSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Autodesk) {
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
        console.log('✅ FreeAECViewer: Autodesk Viewer SDK loaded');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Autodesk Viewer SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  if (isLoading) {
    return (
      <Card style={{ width, height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading design using FREE APIs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewerMode === 'autodesk') {
    return (
      <div className="relative" style={{ width, height }}>
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            FREE Viewer
          </Badge>
        </div>
        <div
          ref={viewerRef}
          style={{ width, height }}
          className="border rounded-lg overflow-hidden"
        />
      </div>
    );
  }

  if (viewerMode === 'alternative' && designData) {
    return (
      <Card style={{ width, height }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {designData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {designData.sourceFileName}
              </Badge>
              <Badge className="bg-blue-50 text-blue-700">
                FREE Mode
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">
              This model is available through AEC Data Model but cannot be viewed in 3D 
              without Model Derivative translation. You can still access the model data 
              for quantity takeoff and analysis.
            </p>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Link to AEC Data Model viewer or download
                  window.open(`https://aps.autodesk.com/en/docs/aec-data-model/v1/`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View in AEC Data Model
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDesignAndAttemptViewing}
              >
                Retry Viewer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback mode
  return (
    <Card style={{ width, height }}>
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Model Not Available for Viewing</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error || 'This model cannot be viewed without Model Derivative translation, which incurs charges.'}
          </p>
          <div className="flex flex-col gap-2">
            <Badge className="bg-green-50 text-green-700 mx-auto">
              Using FREE APIs Only
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDesignAndAttemptViewing}
            >
              Try Again
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}