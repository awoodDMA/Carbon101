'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link2, ExternalLink, CheckCircle, Clock, User, FileText, Database, AlertCircle, Play, Settings, Maximize2 } from 'lucide-react';
import ViewerChart from '@/components/ViewerChart';
import DataTable from '@/components/DataTable';
import ModelPickerPopup from '@/components/ModelPickerPopup';
import SimpleAutodeskViewer from '@/components/SimpleAutodeskViewer';
import EmbodiedCarbonChart from '@/components/EmbodiedCarbonChart';
import { getAllProjects, type APSModelAssignment } from '@/lib/projectData';
import { getProjectById, getOptionByProjectAndLetter, getOptionsByProjectId } from '@/lib/relational-data';
import { updateProjectLinkedModel } from '@/lib/actions';

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
  
  // NEW RELATIONAL APPROACH - Separate project and option queries
  console.log('🚨 USING NEW RELATIONAL DATA STRUCTURE');
  console.log('🔍 Querying project:', projectId);
  console.log('🔍 Querying option:', optionId);
  
  const project = getProjectById(projectId);
  if (!project) {
    console.error('❌ Project not found:', projectId);
    return <div>Project not found: {projectId}</div>;
  }
  
  const optionLetter = optionId?.toUpperCase() || 'A';
  const currentOption = getOptionByProjectAndLetter(projectId, optionLetter);
  
  if (!currentOption) {
    console.error('❌ Option not found:', optionLetter);
    const availableOptions = getOptionsByProjectId(projectId);
    console.error('Available options:', availableOptions.map(o => o.optionLetter));
    return <div>Option not found: {optionLetter}</div>;
  }
  
  // Get all options for this project for sidebar/navigation
  const allProjectOptions = getOptionsByProjectId(projectId);

  // Critical debugging with relational data
  console.log('🚨 RELATIONAL DEBUG - Option Selection:');
  console.log('  URL optionId:', optionId);
  console.log('  Processed optionLetter:', optionLetter);
  console.log('  Found option name:', currentOption.name);
  console.log('  Found option carbon:', currentOption.carbon);
  console.log('  Option A carbon should be 245, Option B should be 198, Option C should be 156');
  
  // Log the actual systems data being passed
  console.log('🚨 RELATIONAL DEBUG - Systems Data:');
  console.log('  Systems to chart:', currentOption.systems?.map(s => `${s.name}: ${s.carbon}`));
  
  // Validate that we're actually getting different options
  if (optionLetter === 'A' && currentOption.carbon !== 245) {
    console.error('❌ BUG: Option A should have 245 carbon but has:', currentOption.carbon);
  }
  if (optionLetter === 'B' && currentOption.carbon !== 198) {
    console.error('❌ BUG: Option B should have 198 carbon but has:', currentOption.carbon);
  }
  if (optionLetter === 'C' && currentOption.carbon !== 156) {
    console.error('❌ BUG: Option C should have 156 carbon but has:', currentOption.carbon);
  }

  // State for model linking
  const [isModelBrowserOpen, setIsModelBrowserOpen] = useState(false);
  const [linkedModel, setLinkedModel] = useState<APSModelAssignment | undefined>(currentOption.linkedModel);
  const [isLinking, setIsLinking] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');

  // Update linked model when option changes
  useEffect(() => {
    console.log('🔄 Option changed, updating linked model:', {
      optionId,
      currentOptionId: currentOption.id,
      linkedModel: currentOption.linkedModel
    });
    setLinkedModel(currentOption.linkedModel);
  }, [currentOption.linkedModel, optionId, currentOption.id]);

  // Fetch access token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/auth/autodesk/token');
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.access_token);
        }
      } catch (error) {
        console.error('Failed to fetch access token:', error);
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
      
      // Update via server action
      console.log('Saving to server...');
      const result = await updateProjectLinkedModel(projectId, optionLetter, newLinkedModel);
      console.log('Server update result:', result);
      
      // Close the browser
      setIsModelBrowserOpen(false);
      
      console.log('Model linking completed successfully');
      
      // Don't refresh/reload the page - it causes URL issues
      // The local state update is sufficient for immediate feedback
      console.log('✅ Project Page: Model linked successfully, no page refresh needed');
      
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
      <div className="max-w-7xl mx-auto">
        {/* Clean Header - Just Title and Options */}
        <div className="flex items-center justify-between py-6 px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Option {currentOption.optionLetter} - {currentOption.name} ({currentOption.carbon} tCO₂e)
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModelBrowserOpen(true)}
              disabled={isLinking}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" />
              {isLinking ? 'Linking...' : 'Link Model'}
            </button>
          </div>
        </div>

        {/* 3D Model Viewer - Full Width */}
        <div className="px-6 mb-8">
          <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg">
            {linkedModel?.status === 'ready' && linkedModel.viewerUrn ? (
              <SimpleAutodeskViewer
                urn={linkedModel.viewerUrn.startsWith('urn:') ? linkedModel.viewerUrn : `urn:${linkedModel.viewerUrn}`}
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
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Maximize2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {!linkedModel ? 'No Model Linked' : 
                     linkedModel.status === 'processing' ? 'Model Processing' :
                     linkedModel.status === 'failed' ? 'Model Failed' :
                     'No Model Available'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {!linkedModel ? 'Use "Link Model" to connect an Autodesk model' :
                     linkedModel.status === 'processing' ? 'Model translation is in progress' :
                     linkedModel.status === 'failed' ? 'Model translation failed' :
                     'Model not ready for viewing'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Model Caption/Info */}
          {linkedModel && (
            <div className="mt-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{linkedModel.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>Modified {new Date(linkedModel.lastModified).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        linkedModel.status === 'ready' ? 'bg-green-500' :
                        linkedModel.status === 'processing' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`} />
                      <span className="capitalize">{linkedModel.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    currentOption.metadata?.calculationStatus === 'Complete' ? 'bg-green-100 text-green-800' :
                    currentOption.metadata?.calculationStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    currentOption.metadata?.calculationStatus === 'Review' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentOption.metadata?.calculationStatus || 'Draft'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Embodied Carbon Chart - Clean Design */}
        <div className="px-6 mb-8">
          <div className="bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Embodied Carbon by System - {currentOption.carbon} tCO₂e Total
            </h2>
            <EmbodiedCarbonChart 
              key={`chart-${projectId}-${optionId}-${currentOption.carbon}-${currentOption.systems.length}`} 
              systems={currentOption.systems} 
            />
          </div>
        </div>

        {/* Data Table - Clean Design */}
        <div className="px-6 mb-8">
          <div className="bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Detailed Breakdown - {currentOption.name}
            </h2>
            <DataTable 
              key={`table-${projectId}-${optionId}-${currentOption.systemsData.length}-${currentOption.productsData.length}`}
              systemsData={currentOption.systemsData}
              productsData={currentOption.productsData}
            />
          </div>
        </div>
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

// Wrapper component that forces remounting when parameters change
export default function OptionPage({ params }: OptionPageProps) {
  const { projectId, optionId } = params;
  
  // Force complete component remount when route parameters change
  return (
    <OptionPageContent 
      key={`${projectId}-${optionId}`} 
      params={params} 
    />
  );
}