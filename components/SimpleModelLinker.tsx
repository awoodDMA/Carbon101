'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  File, 
  Loader2, 
  AlertCircle, 
  Link2,
  CheckCircle
} from 'lucide-react';
import { apsService, type APSProject, type APSHub, type APSItem, type APSVersion } from '@/lib/autodesk-aps';
import { type APSModelAssignment } from '@/lib/projectData';

interface SimpleModelLinkerProps {
  projectId: string;
  optionId: string;
  currentLinkedModel?: APSModelAssignment;
}

export default function SimpleModelLinker({ 
  projectId, 
  optionId, 
  currentLinkedModel
}: SimpleModelLinkerProps) {
  const [hubs, setHubs] = useState<APSHub[]>([]);
  const [projects, setProjects] = useState<APSProject[]>([]);
  const [selectedHub, setSelectedHub] = useState<APSHub | null>(null);
  const [selectedProject, setSelectedProject] = useState<APSProject | null>(null);
  const [items, setItems] = useState<APSItem[]>([]);
  const [versions, setVersions] = useState<APSVersion[]>([]);
  const [selectedItem, setSelectedItem] = useState<APSItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedModel, setLinkedModel] = useState<APSModelAssignment | undefined>(currentLinkedModel);

  useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hubsData = await apsService.getHubs();
      setHubs(hubsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load hubs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHubSelect = async (hub: APSHub) => {
    setSelectedHub(hub);
    setSelectedProject(null);
    setItems([]);
    setVersions([]);
    setIsLoading(true);

    try {
      const projectsData = await apsService.getProjects(hub.id);
      setProjects(projectsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (project: APSProject) => {
    setSelectedProject(project);
    setItems([]);
    setVersions([]);
    setIsLoading(true);

    try {
      // Get top folders first
      const folders = await apsService.getProjectTopFolders(selectedHub!.id, project.id);
      
      // For simplicity, just get contents from the first folder
      if (folders.length > 0) {
        const folderContents = await apsService.getFolderContents(project.id, folders[0].id);
        const itemsOnly = folderContents.filter(item => item.type === 'items') as APSItem[];
        setItems(itemsOnly);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load project contents';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = async (item: APSItem) => {
    setSelectedItem(item);
    setVersions([]);
    setIsLoading(true);

    try {
      const projectIdFromItem = extractProjectIdFromItem(item);
      if (projectIdFromItem) {
        const versionsData = await apsService.getItemVersions(projectIdFromItem, item.id);
        setVersions(versionsData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load versions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractProjectIdFromItem = (item: APSItem): string | null => {
    if (item.relationships?.parent?.data?.id) {
      const parentId = item.relationships.parent.data.id;
      const match = parentId.match(/projects\/([^\/]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const handleLinkModel = async (item: APSItem, version: APSVersion) => {
    setIsLinking(true);
    setError(null);
    try {
      console.log('🔗 SimpleModelLinker: Linking model:', item.attributes.displayName);
      console.log('🔗 SimpleModelLinker: Version ID:', version.id);
      console.log('🔗 SimpleModelLinker: Project ID:', selectedProject?.id);
      
      // Check authentication first
      if (!apsService.isAuthenticated()) {
        throw new Error('Not authenticated with Autodesk APS. Please check your authentication in Settings.');
      }
      
      // STEP 1: Extract storage URN from version data
      const projectIdForUrn = selectedProject?.id;
      if (!projectIdForUrn) {
        throw new Error('No project selected for URN extraction');
      }
      
      console.log('🔧 SimpleModelLinker: Getting storage URN...');
      const storageUrn = await apsService.getStorageUrn(projectIdForUrn, version.id);
      console.log('🔧 SimpleModelLinker: Storage URN:', storageUrn);
      
      // STEP 2: Submit for translation to Model Derivative API
      console.log('🔧 SimpleModelLinker: Starting model translation...');
      const translationResult = await apsService.translateModel(storageUrn);
      console.log('🔧 SimpleModelLinker: Translation result:', translationResult);
      
      // STEP 3: Check if translation was successful or needs time
      if (translationResult.status === 'failed') {
        throw new Error('Model translation failed. The file may be corrupted or in an unsupported format.');
      }
      
      if (translationResult.status === 'inprogress') {
        console.log('⏳ SimpleModelLinker: Translation in progress, model will be available once complete');
      }
      
      const newLinkedModel: APSModelAssignment = {
        id: `${item.id}-${version.id}`,
        hubId: selectedHub?.id || '',
        projectId: selectedProject?.id || '',
        itemId: item.id,
        versionId: version.id,
        name: item.attributes.displayName,
        fileName: item.attributes.fileName,
        fileType: item.attributes.fileType,
        viewerUrn: translationResult.urn,
        thumbnailUrl: '', // Will be empty for now
        lastModified: version.attributes.lastModifiedTime,
        assignedAt: new Date().toISOString(),
        status: translationResult.status === 'success' ? 'ready' : 'processing',
      };

      setLinkedModel(newLinkedModel);
      
      // Link via API route (avoiding server actions for now)
      const response = await fetch('/api/link-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          optionId,
          linkedModel: newLinkedModel
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to link model');
      }
      
      console.log('✅ SimpleModelLinker: Model linked successfully');
      
    } catch (error) {
      console.error('❌ SimpleModelLinker: Failed to link model:', error);
      setLinkedModel(currentLinkedModel);
      setError(error instanceof Error ? error.message : 'Failed to link model');
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
            <CheckCircle className="w-5 h-5 text-green-600" />
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

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Hubs */}
        <div>
          <h4 className="text-sm font-medium mb-2">1. Select Hub</h4>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleHubSelect(hub)}
                className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${
                  selectedHub?.id === hub.id ? 'bg-blue-50' : ''
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                {hub.attributes.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Projects */}
        <div>
          <h4 className="text-sm font-medium mb-2">2. Select Project</h4>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${
                  selectedProject?.id === project.id ? 'bg-blue-50' : ''
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2 text-green-600" />
                {project.attributes.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Items */}
        <div>
          <h4 className="text-sm font-medium mb-2">3. Select File</h4>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${
                  selectedItem?.id === item.id ? 'bg-blue-50' : ''
                }`}
              >
                <File className="w-4 h-4 inline mr-2" />
                <div>
                  <div>{item.attributes.displayName}</div>
                  <div className="text-xs text-gray-500">{item.attributes.fileType}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Versions */}
        <div>
          <h4 className="text-sm font-medium mb-2">4. Select Version</h4>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-2 border-b last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <div>Version {version.attributes.versionNumber}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(version.attributes.createTime).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => selectedItem && handleLinkModel(selectedItem, version)}
                    disabled={isLinking || !selectedItem}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Link2 className="w-3 h-3" />
                    {isLinking ? 'Linking...' : 'Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}