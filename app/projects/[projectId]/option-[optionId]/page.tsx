'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Link2, ExternalLink, CheckCircle, Clock, User, FileText, Database, AlertCircle, Play, Settings, Maximize2 } from 'lucide-react';
import ViewerChart from '@/components/ViewerChart';
import DataTable from '@/components/DataTable';
import ModelPickerPopup from '@/components/ModelPickerPopup';
import SimpleAutodeskViewer from '@/components/SimpleAutodeskViewer';
import EmbodiedCarbonChart from '@/components/EmbodiedCarbonChart';
import QuantityTakeoffResults from '@/components/QuantityTakeoffResults';
import { getProjectById, getOptionByProjectAndLetter, getOptionsByProjectId, updateOptionLinkedModel, reloadDataFromStorage, type APSModelAssignment } from '@/lib/relational-data';
import { QuantityTakeoffResult } from '@/lib/quantity-takeoff';

interface OptionPageProps {
  params: { projectId: string; optionId: string }
}

interface SelectedModel {
  id: string;
  hubId: string;
  projectId: string;
  itemId: string;
  versionId: string;
  name: string;
  fileName: string;
  fileType: string;
  viewerUrn: string;
  lastModified: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force component to remount when route parameters change
function OptionPageContent({ params }: OptionPageProps) {
  const { projectId, optionId } = params;
  const router = useRouter();
  const pathname = usePathname();
  
  // Fallback: extract optionId from pathname if params.optionId is undefined
  const extractedOptionId = optionId || pathname.split('/option-')[1]?.split('/')[0];
  const finalOptionId = extractedOptionId;
  
  
  // Using relational data structure for proper option switching
  
  const project = getProjectById(projectId);
  if (!project) {
    console.error('❌ Project not found:', projectId);
    return <div>Project not found: {projectId}</div>;
  }
  
  const optionLetter = finalOptionId?.toUpperCase() || 'A';
  const currentOption = getOptionByProjectAndLetter(projectId, optionLetter);
  
  
  if (!currentOption) {
    console.error('❌ Option not found:', optionLetter);
    const availableOptions = getOptionsByProjectId(projectId);
    console.error('Available options:', availableOptions.map(o => o.optionLetter));
    return <div>Option not found: {optionLetter}</div>;
  }
  
  // Get all options for this project for sidebar/navigation
  const allProjectOptions = getOptionsByProjectId(projectId);


  // State for model linking
  const [isModelBrowserOpen, setIsModelBrowserOpen] = useState(false);
  const [linkedModel, setLinkedModel] = useState<APSModelAssignment | undefined>(currentOption.linkedModel);
  const [isLinking, setIsLinking] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  // Fixed viewer height to match the viewer component's internal constraints
  const VIEWER_HEIGHT = '500px'; // Fixed height to match viewer constraints

  // Update linked model when option changes or when component mounts
  useEffect(() => {
    console.log('🔄 Option changed, updating linked model:', {
      optionId,
      optionLetter,
      currentOptionId: currentOption.id,
      linkedModel: currentOption.linkedModel
    });
    setLinkedModel(currentOption.linkedModel);
  }, [optionLetter, currentOption.id, currentOption.linkedModel]);

  // Force refresh of linked model data when component mounts or route changes
  useEffect(() => {
    console.log('🔄 Component mounted/route changed - refreshing linked model data');
    
    // Reload data from localStorage to ensure we have the latest data
    reloadDataFromStorage();
    
    const freshOption = getOptionByProjectAndLetter(projectId, optionLetter);
    if (freshOption?.linkedModel) {
      console.log('🔄 Found persisted linked model:', freshOption.linkedModel.name);
      setLinkedModel(freshOption.linkedModel);
    } else {
      console.log('🔄 No persisted linked model found');
      setLinkedModel(undefined);
    }
  }, [pathname, projectId, optionLetter]); // pathname ensures this runs on navigation

  // Fetch access token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('🔑 Fetching access token...');
        const response = await fetch('/api/auth/autodesk/token');
        if (response.ok) {
          const data = await response.json();
          console.log('🔑 Access token received:', data.access_token ? '✅ Present' : '❌ Missing');
          setAccessToken(data.access_token);
        } else {
          console.error('🔑 Failed to fetch access token - HTTP', response.status);
        }
      } catch (error) {
        console.error('🔑 Failed to fetch access token:', error);
      }
    };
    fetchToken();
  }, []);

  const handleModelSelect = async (model: SelectedModel) => {
    setIsLinking(true);
    
    try {
      console.log('🔗 Project Page: Starting model linking process for:', model.name);
      
      // Validate model data
      if (!model || !model.id || !model.projectId || !model.versionId) {
        throw new Error('Invalid model data provided - missing required fields');
      }
      
      console.log('🚀 Project Page: Requesting model translation via API...');
      
      // Use the translation API to get the proper URN
      const translationResponse = await fetch('/api/autodesk/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: model.projectId,
          versionId: model.versionId
        })
      });

      if (!translationResponse.ok) {
        const errorData = await translationResponse.json();
        throw new Error(errorData.error || 'Translation request failed');
      }

      const translationData = await translationResponse.json();
      console.log('✅ Project Page: Translation API response:', translationData);

      if (!translationData.success) {
        throw new Error(translationData.error || 'Translation failed');
      }

      const { viewerUrn, status, thumbnailUrl, message } = translationData.data;

      // Show user-friendly status message
      if (status === 'inprogress') {
        console.log('⏳ Project Page:', message);
      } else if (status === 'success') {
        console.log('✅ Project Page:', message);
      }
      
      const newLinkedModel: APSModelAssignment = {
        id: model.id,
        hubId: model.hubId,
        projectId: model.projectId,
        itemId: model.itemId,
        versionId: model.versionId,
        name: model.name,
        fileName: model.fileName,
        fileType: model.fileType,
        viewerUrn: viewerUrn,
        thumbnailUrl: thumbnailUrl || '',
        lastModified: model.lastModified,
        assignedAt: new Date().toISOString(),
        status: status === 'success' ? 'ready' : 'processing',
      };

      console.log('Created linked model object:', newLinkedModel);

      // Update local state immediately for instant feedback
      setLinkedModel(newLinkedModel);
      
      // Update via client-side storage using the same function the server action uses
      console.log('💾 Saving to localStorage...');
      const success = updateOptionLinkedModel(projectId, optionLetter, newLinkedModel);
      console.log('💾 LocalStorage update result:', success ? 'SUCCESS' : 'FAILED');
      
      if (!success) {
        throw new Error('Failed to save linked model to localStorage');
      }
      
      // Verify the data was saved by re-reading it
      const verifyOption = getOptionByProjectAndLetter(projectId, optionLetter);
      console.log('✅ Verification - saved model:', verifyOption?.linkedModel?.name || 'NOT FOUND');
      
      // Close the browser
      setIsModelBrowserOpen(false);
      
      console.log('✅ Model linking completed and verified successfully');
      
    } catch (error) {
      console.error('Failed to link model:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // Reset local state on error
      setLinkedModel(currentOption.linkedModel);
      
      // Show error to user (you might want to add a toast/notification here)
      alert(`Failed to link model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLinking(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* 3D Model Viewer - Responsive Height with Natural Proportions */}
      <div className="w-full border-b border-gray-200">
        <div 
          className="w-full overflow-hidden relative"
          style={{ 
            height: VIEWER_HEIGHT // Let model determine its natural proportions within this height
          }}
        >
          {linkedModel?.status === 'ready' && linkedModel.viewerUrn && accessToken ? (
            (() => {
                // Validate and prepare URN for the viewer
                const rawUrn = linkedModel.viewerUrn;
                console.log('🔍 Option Page: Raw URN from linkedModel:', rawUrn);
                console.log('🔍 Option Page: URN type:', typeof rawUrn);
                console.log('🔍 Option Page: URN length:', rawUrn?.length);
                
                // Ensure URN is a valid string
                if (!rawUrn || typeof rawUrn !== 'string' || rawUrn.trim().length === 0) {
                  console.error('❌ Option Page: Invalid URN - not a valid string');
                  return (
                    <div className="flex items-center justify-center h-full bg-red-50">
                      <div className="text-center text-red-800">
                        <p className="text-sm font-medium">Invalid Model URN</p>
                        <p className="text-xs mt-1">The model URN is invalid or missing</p>
                      </div>
                    </div>
                  );
                }
                
                // Check for null/undefined in URN string
                if (rawUrn.includes('null') || rawUrn.includes('undefined')) {
                  console.error('❌ Option Page: URN contains null/undefined values:', rawUrn);
                  return (
                    <div className="flex items-center justify-center h-full bg-red-50">
                      <div className="text-center text-red-800">
                        <p className="text-sm font-medium">Corrupted Model URN</p>
                        <p className="text-xs mt-1">The model URN contains invalid data</p>
                      </div>
                    </div>
                  );
                }

                const finalUrn = rawUrn.startsWith('urn:') ? rawUrn : `urn:${rawUrn}`;
                console.log('✅ Option Page: Final URN for viewer:', finalUrn);
                
                return (
                  <SimpleAutodeskViewer
                    urn={finalUrn}
                    accessToken={accessToken}
                    width="100%"
                    height="100%"
                    onDocumentLoad={(doc) => {
                      console.log('Option Page: Document loaded:', doc);
                    }}
                    onGeometryLoad={(model) => {
                      console.log('Option Page: Geometry loaded - ready for quantity takeoff');
                    }}
                    onError={(error) => {
                      console.error('Option Page: Viewer error:', error);
                    }}
                  />
                );
            })()
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Maximize2 className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {!linkedModel ? 'No Model Linked' : 
                   !accessToken ? 'Loading Authentication...' :
                   linkedModel.status === 'processing' ? 'Model Processing' :
                   linkedModel.status === 'failed' ? 'Model Failed' :
                   !linkedModel.viewerUrn ? 'No Viewer URN' :
                   'No Model Available'}
                </p>
                <p className="text-sm text-gray-600">
                  {!linkedModel ? 'Use "Link Model" to connect an Autodesk model' :
                   !accessToken ? 'Authenticating with Autodesk...' :
                   linkedModel.status === 'processing' ? 'Model translation is in progress' :
                   linkedModel.status === 'failed' ? 'Model translation failed' :
                   !linkedModel.viewerUrn ? 'Model URN missing or invalid' :
                   'Model not ready for viewing'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Clean Header Section */}
      <div>
        <div className="max-w-7xl mx-auto px-6 py-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                <span>Option {currentOption.optionLetter}</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {currentOption.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dynamic Model Link Button */}
              {linkedModel && linkedModel.status === 'ready' ? (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}
                  title={linkedModel.name}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Model Linked</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsModelBrowserOpen(true)}
                  disabled={isLinking}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 hover:bg-gray-300"
                  style={{ backgroundColor: '#e8e8e8', color: '#666666' }}
                >
                  <Link2 className="w-4 h-4" />
                  <span>{isLinking ? 'Linking...' : 'Link Model'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Embodied Carbon Chart */}
        <section>
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900">
              Embodied Carbon by System
            </h2>
          </div>
          <EmbodiedCarbonChart 
            key={`chart-${projectId}-${optionId}`} 
            systems={currentOption.systems} 
          />
        </section>

        {/* Quantity Takeoff Results */}
        {linkedModel?.status === 'ready' && linkedModel.viewerUrn && (
          <section>
            <QuantityTakeoffResults
              modelUrn={linkedModel.viewerUrn}
              projectId={projectId}
              optionId={finalOptionId}
              versionId={linkedModel.versionId}
              onTakeoffComplete={(result: QuantityTakeoffResult) => {
                console.log('📊 Quantity takeoff completed for option:', finalOptionId, result);
                // TODO: Update option data with takeoff results
                // This could trigger recalculation of embodied carbon values
                // Consider updating the existing charts with real takeoff data
              }}
            />
          </section>
        )}

        {/* Data Table */}
        <section>
          <DataTable 
            key={`table-${projectId}-${optionId}`}
            systemsData={currentOption.systemsData}
            productsData={currentOption.productsData}
          />
        </section>
      </div>

      {/* Model Picker Popup */}
      <ModelPickerPopup
        isOpen={isModelBrowserOpen}
        onClose={() => setIsModelBrowserOpen(false)}
        onModelSelect={handleModelSelect}
        isLinking={isLinking}
      />
    </div>
  );
}

export default function OptionPage({ params }: OptionPageProps) {
  return <OptionPageContent key={`${params.projectId}-${params.optionId}`} params={params} />;
}