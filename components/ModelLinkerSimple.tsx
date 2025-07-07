'use client';

import { useState } from 'react';
import { 
  Search,
  Check,
  Link2,
  Building2
} from 'lucide-react';
import AutodeskFileBrowser from './AutodeskFileBrowser';
import { updateProjectLinkedModel } from '@/lib/actions';
import { type APSModelAssignment } from '@/lib/autodesk-aps';

interface ModelLinkerSimpleProps {
  projectId: string;
  optionId: string;
  currentLinkedModel?: APSModelAssignment;
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

export default function ModelLinkerSimple({ 
  projectId, 
  optionId, 
  currentLinkedModel
}: ModelLinkerSimpleProps) {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [linkedModel, setLinkedModel] = useState<APSModelAssignment | undefined>(currentLinkedModel);
  const [isLinking, setIsLinking] = useState(false);

  const handleModelSelect = async (model: SelectedModel) => {
    console.log('ModelLinkerSimple: handleModelSelect called with model:', model);
    setIsLinking(true);
    
    try {
      console.log('🚀 ModelLinkerSimple: Requesting model translation via API...');
      
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
      console.log('✅ ModelLinkerSimple: Translation API response:', translationData);

      if (!translationData.success) {
        throw new Error(translationData.error || 'Translation failed');
      }

      const { viewerUrn, status, thumbnailUrl, message } = translationData.data;

      // Show user-friendly status message
      if (status === 'inprogress') {
        console.log('⏳ ModelLinkerSimple:', message);
      } else if (status === 'success') {
        console.log('✅ ModelLinkerSimple:', message);
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

      console.log('ModelLinkerSimple: Created linkedModel:', newLinkedModel);
      setLinkedModel(newLinkedModel);
      
      // Update via server action
      console.log('ModelLinkerSimple: Updating project linked model...');
      const result = await updateProjectLinkedModel(projectId, optionId, newLinkedModel);
      console.log('ModelLinkerSimple: Update result:', result);
      
      console.log('ModelLinkerSimple: Model linked successfully:', newLinkedModel);
    } catch (error) {
      console.error('ModelLinkerSimple: Failed to link model:', error);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Linked Model */}
      {linkedModel && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Linked Model</h3>
              <p className="text-sm text-green-800">{linkedModel.name}</p>
              <p className="text-xs text-green-700">
                {linkedModel.fileName} • Linked {new Date(linkedModel.assignedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Browse Button */}
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Browse ACC Projects</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select a model from your Autodesk Construction Cloud projects to link to this design option.
        </p>
        <button
          onClick={() => setIsBrowserOpen(true)}
          disabled={isLinking}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {isLinking ? 'Linking Model...' : 'Browse ACC Files'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Before you start:</p>
          <ul className="space-y-1">
            <li>• Make sure you&apos;re authenticated with Autodesk (check Settings)</li>
            <li>• Only one model can be linked per design option</li>
            <li>• Linking a new model will replace any existing model</li>
            <li>• The linked model will appear in the 3D viewer and carbon analysis</li>
          </ul>
        </div>
      </div>

      {/* File Browser Modal */}
      <AutodeskFileBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onModelSelect={handleModelSelect}
      />
    </div>
  );
}