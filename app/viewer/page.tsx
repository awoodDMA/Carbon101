'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AutodeskViewer from '@/components/AutodeskViewer';
import SimpleAutodeskViewer from '@/components/SimpleAutodeskViewer';

export default function ViewerPage() {
  const searchParams = useSearchParams();
  const [urn, setUrn] = useState<string>('');
  const [processedUrn, setProcessedUrn] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [useUrlParams, setUseUrlParams] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string>('');
  const [viewerStatus, setViewerStatus] = useState<string>('Waiting for input...');
  const [useSimpleViewer, setUseSimpleViewer] = useState(false);

  // Get parameters from URL
  useEffect(() => {
    const urlUrn = searchParams.get('urn');
    const urlToken = searchParams.get('token');
    
    if (urlUrn) {
      setUrn(urlUrn);
      setUseUrlParams(true);
    }
    
    if (urlToken) {
      setAccessToken(urlToken);
    } else if (urlUrn) {
      // If URN provided but no token, try to fetch from auth system
      fetchAccessToken();
    }
  }, [searchParams]);

  // Fetch access token from existing auth system
  const fetchAccessToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/autodesk/token');
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
      } else {
        console.error('Failed to fetch access token');
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process URN when it changes
  useEffect(() => {
    if (!urn) {
      setProcessedUrn('');
      setViewerError('');
      setViewerStatus('Waiting for input...');
      return;
    }

    setViewerError('');
    
    // If it looks like a BIM 360 URL, show error
    if (urn.includes('docs.b360.autodesk.com') || urn.includes('acc.autodesk.com')) {
      setViewerError('You provided a BIM 360/ACC URL. This needs to be converted to a derivative URN first. Please use the main app to link the model and get the proper URN.');
      setProcessedUrn('');
      return;
    }
    
    // If it looks like a storage URN, convert to base64
    if (urn.startsWith('urn:adsk.objects:os.object:')) {
      console.log('Converting storage URN to viewer URN:', urn);
      const base64Urn = btoa(urn).replace(/=/g, '');
      const viewerUrn = `urn:${base64Urn}`; // Add "urn:" prefix
      setViewerStatus(`Converted storage URN to viewer format: ${viewerUrn.substring(0, 50)}...`);
      setProcessedUrn(viewerUrn);
      return;
    }
    
    // If it's already base64 (no special characters), add urn: prefix if missing
    if (/^[A-Za-z0-9+/]*$/.test(urn)) {
      const finalUrn = urn.startsWith('urn:') ? urn : `urn:${urn}`;
      setViewerStatus(`Using base64 URN with proper format: ${finalUrn.substring(0, 50)}...`);
      setProcessedUrn(finalUrn);
      return;
    }
    
    setViewerError('URN format not recognized. Please provide either a storage URN (urn:adsk.objects:os.object:...) or base64-encoded derivative URN.');
    setProcessedUrn('');
  }, [urn]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken && urn) {
      fetchAccessToken();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Simple Autodesk Viewer</h1>
          
          {/* Instructions */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">How to use:</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p><strong>⚠️ Important:</strong> You cannot use BIM 360/ACC URLs directly!</p>
                <p className="text-red-600">A BIM 360 URL like <code>https://docs.b360.autodesk.com/projects/...</code> must first be translated to a derivative URN.</p>
              </div>
              
              <div>
                <p><strong>Option 1 - Get URN from main app:</strong></p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Go to the main app and link a model to a project option</li>
                  <li>Look for the linked model's <code>viewerUrn</code> in the console or debug info</li>
                  <li>Copy that URN and paste it here</li>
                </ol>
              </div>
              
              <div>
                <p><strong>Option 2 - If you have a storage URN:</strong></p>
                <p>Paste a storage URN like: <code className="bg-gray-100 px-1 rounded">urn:adsk.objects:os.object:wip.dm.prod/12345</code></p>
                <p>The page will automatically convert it to base64 for the viewer.</p>
              </div>
              
              <div>
                <p><strong>Option 3 - Direct base64 URN:</strong></p>
                <p>If you already have a base64-encoded derivative URN, paste it directly.</p>
              </div>
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Manual Input</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="urn" className="block text-sm font-medium text-gray-700 mb-2">
                  Model URN (base64 encoded)
                </label>
                <input
                  type="text"
                  id="urn"
                  value={urn}
                  onChange={(e) => setUrn(e.target.value)}
                  placeholder="urn:adsk.objects:os.object:... or dXJuOmFkc2sud2lwcHJv..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token (optional - will fetch automatically if logged in)
                </label>
                <input
                  type="text"
                  id="token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!urn || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load Model'}
                </button>
                <button
                  type="button"
                  onClick={() => setUseSimpleViewer(!useSimpleViewer)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {useSimpleViewer ? 'Use Complex Viewer' : 'Use Simple Viewer'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!processedUrn || !accessToken) {
                      alert('Need both URN and access token to test');
                      return;
                    }
                    
                    setLoading(true);
                    try {
                      const response = await fetch('/api/debug/test-viewer-urn', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urn: processedUrn, accessToken })
                      });
                      
                      const result = await response.json();
                      console.log('🔍 Debug test result:', result);
                      
                      if (result.success) {
                        setViewerStatus(`✅ Debug: URN and token valid. Manifest status: ${result.data.manifestStatus}`);
                      } else {
                        setViewerError(`Debug failed: ${result.error}`);
                      }
                    } catch (error) {
                      console.error('Debug test failed:', error);
                      setViewerError(`Debug test failed: ${error}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!processedUrn || !accessToken || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Debug Test
                </button>
              </div>
            </form>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">URN:</span> 
                <span className={urn ? 'text-green-600' : 'text-red-600'}>
                  {urn ? ' ✓ Provided' : ' ✗ Missing'}
                </span>
              </div>
              <div>
                <span className="font-medium">Access Token:</span> 
                <span className={accessToken ? 'text-green-600' : 'text-red-600'}>
                  {accessToken ? ' ✓ Available' : ' ✗ Missing'}
                </span>
              </div>
            </div>
            
            {/* Viewer Status */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Status:</strong> {viewerStatus}
              </p>
            </div>
            
            {/* Error Display */}
            {viewerError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {viewerError}
                </p>
              </div>
            )}
            
            {urn && !accessToken && !viewerError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  URN provided but no access token. 
                  {' '}
                  <button 
                    onClick={fetchAccessToken}
                    className="underline hover:no-underline"
                    disabled={loading}
                  >
                    Click here to fetch token from auth system
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Viewer */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">3D Model Viewer</h3>
            </div>
            <div style={{ height: '600px' }}>
              {processedUrn && accessToken && !viewerError ? (
                useSimpleViewer ? (
                  <SimpleAutodeskViewer
                    urn={processedUrn}
                    accessToken={accessToken}
                    width="100%"
                    height="100%"
                    onDocumentLoad={(doc) => {
                      console.log('✅ Simple Viewer: Document loaded successfully:', doc);
                      setViewerStatus('✅ Document loaded successfully');
                    }}
                    onGeometryLoad={(model) => {
                      console.log('✅ Simple Viewer: Geometry loaded successfully:', model);
                      setViewerStatus('✅ 3D Model loaded and ready');
                    }}
                    onError={(error) => {
                      console.error('❌ Simple Viewer error:', error);
                      setViewerError(`Simple Viewer failed to load: ${error}`);
                      setViewerStatus('❌ Failed to load model');
                    }}
                  />
                ) : (
                  <AutodeskViewer
                    urn={processedUrn}
                    accessToken={accessToken}
                    width="100%"
                    height="100%"
                    onDocumentLoad={(doc) => {
                      console.log('✅ Complex Viewer: Document loaded successfully:', doc);
                      setViewerStatus('✅ Document loaded successfully');
                    }}
                    onGeometryLoad={(model) => {
                      console.log('✅ Complex Viewer: Geometry loaded successfully:', model);
                      setViewerStatus('✅ 3D Model loaded and ready');
                    }}
                    onError={(error) => {
                      console.error('❌ Complex Viewer error:', error);
                      console.error('❌ Full error details:', {
                        error,
                        urn: processedUrn,
                        tokenLength: accessToken.length,
                        timestamp: new Date().toISOString()
                      });
                      setViewerError(`Complex Viewer failed to load: ${error}`);
                      setViewerStatus('❌ Failed to load model');
                    }}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-gray-600">
                      {!urn ? 'Please provide a model URN to display' : 
                       !accessToken ? 'Please provide an access token' :
                       viewerError ? 'URN format error (see above)' :
                       'Processing URN...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Debug Info */}
          {(urn || accessToken) && (
            <div className="mt-6 bg-gray-50 rounded-lg border p-4">
              <h4 className="font-semibold text-sm mb-2">Debug Information</h4>
              <div className="space-y-1 text-xs font-mono">
                <div>Input URN Length: {urn.length}</div>
                <div>Processed URN Length: {processedUrn.length}</div>
                <div>Token Length: {accessToken.length}</div>
                <div>Input URN Preview: {urn.substring(0, 50)}{urn.length > 50 ? '...' : ''}</div>
                <div>Processed URN Preview: {processedUrn.substring(0, 50)}{processedUrn.length > 50 ? '...' : ''}</div>
                <div>Token Preview: {accessToken.substring(0, 50)}{accessToken.length > 50 ? '...' : ''}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}