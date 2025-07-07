'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Loader2, 
  AlertCircle,
  X,
  Link2
} from 'lucide-react';

interface AutodeskFileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect: (model: SelectedModel) => void;
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

interface TreeNode {
  id: string;
  name: string;
  type: 'hub' | 'project' | 'folder' | 'item' | 'version';
  data: any;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  canExpand?: boolean;
}

export default function AutodeskFileBrowser({ isOpen, onClose, onModelSelect }: AutodeskFileBrowserProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen]);

  const loadTree = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('AutodeskFileBrowser: Loading hubs...');
      const response = await fetch('/api/autodesk/hubs');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please authenticate with Autodesk in Settings first.');
        }
        throw new Error(`Failed to load hubs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AutodeskFileBrowser: Received hubs:', data);
      
      if (!data.hubs || data.hubs.length === 0) {
        setError('No ACC accounts found. Please check your Autodesk authentication.');
        setTree([]);
        return;
      }
      
      const hubNodes: TreeNode[] = data.hubs.map((hub: any) => ({
        id: hub.id,
        name: hub.attributes.name,
        type: 'hub' as const,
        data: hub,
        children: [],
        isExpanded: false,
        canExpand: true
      }));
      
      console.log('AutodeskFileBrowser: Created hub nodes:', hubNodes.length);
      setTree(hubNodes);
      
    } catch (error) {
      console.error('AutodeskFileBrowser: Error loading tree:', error);
      const message = error instanceof Error ? error.message : 'Failed to load ACC accounts';
      setError(message);
      setTree([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
    console.log(`AutodeskFileBrowser: Loading children for ${node.type}: ${node.name}`);
    
    try {
      switch (node.type) {
        case 'hub': {
          const url = `/api/autodesk/projects?hubId=${encodeURIComponent(node.id)}`;
          console.log(`AutodeskFileBrowser: Fetching projects from: ${url}`);
          console.log(`AutodeskFileBrowser: Hub ID: ${node.id}`);
          
          const response = await fetch(url);
          console.log(`AutodeskFileBrowser: Projects API response status: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`AutodeskFileBrowser: Projects API error: ${response.status} - ${errorText}`);
            throw new Error(`Failed to load projects: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log(`AutodeskFileBrowser: Projects API response:`, data);
          
          if (!data.projects) {
            console.error(`AutodeskFileBrowser: No projects property in response`);
            throw new Error('Invalid response format: missing projects');
          }
          
          const projectNodes = data.projects.map((project: any) => ({
            id: project.id,
            name: project.attributes.name,
            type: 'project' as const,
            data: { ...project, hubId: node.id },
            children: [],
            isExpanded: false,
            canExpand: true
          }));
          
          console.log(`AutodeskFileBrowser: Created ${projectNodes.length} project nodes`);
          return projectNodes;
        }
        
        case 'project': {
          const response = await fetch(`/api/autodesk/folders?hubId=${encodeURIComponent(node.data.hubId)}&projectId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error(`Failed to load folders: ${response.status}`);
          const data = await response.json();
          
          return data.folders.map((folder: any) => ({
            id: folder.id,
            name: folder.attributes.displayName || folder.attributes.name,
            type: 'folder' as const,
            data: { ...folder, hubId: node.data.hubId, projectId: node.id },
            children: [],
            isExpanded: false,
            canExpand: true
          }));
        }
        
        case 'folder': {
          const response = await fetch(`/api/autodesk/folders?projectId=${encodeURIComponent(node.data.projectId)}&folderId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error(`Failed to load folder contents: ${response.status}`);
          const data = await response.json();
          
          return data.contents.map((item: any) => {
            if (item.type === 'folders') {
              return {
                id: item.id,
                name: item.attributes.displayName || item.attributes.name,
                type: 'folder' as const,
                data: { ...item, hubId: node.data.hubId, projectId: node.data.projectId },
                children: [],
                isExpanded: false,
                canExpand: true
              };
            } else {
              return {
                id: item.id,
                name: item.attributes.displayName,
                type: 'item' as const,
                data: { ...item, hubId: node.data.hubId, projectId: node.data.projectId },
                children: [],
                isExpanded: false,
                canExpand: true // Items can expand to show versions
              };
            }
          });
        }
        
        case 'item': {
          const response = await fetch(`/api/autodesk/versions?projectId=${encodeURIComponent(node.data.projectId)}&itemId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error(`Failed to load versions: ${response.status}`);
          const data = await response.json();
          
          return data.versions.map((version: any) => ({
            id: version.id,
            name: `Version ${version.attributes.versionNumber}`,
            type: 'version' as const,
            data: { ...version, hubId: node.data.hubId, projectId: node.data.projectId, itemId: node.id, itemData: node.data },
            children: [],
            isExpanded: false,
            canExpand: false
          }));
        }
        
        default:
          return [];
      }
    } catch (error) {
      console.error(`AutodeskFileBrowser: Error loading children for ${node.type}:`, error);
      throw error;
    }
  };

  const handleNodeClick = async (node: TreeNode, nodePath: number[]) => {
    console.log(`AutodeskFileBrowser: Clicked ${node.type}: ${node.name} (ID: ${node.id})`);
    console.log(`AutodeskFileBrowser: Node data:`, node.data);
    console.log(`AutodeskFileBrowser: Current expanded state:`, node.isExpanded);
    console.log(`AutodeskFileBrowser: Can expand:`, node.canExpand);
    
    if (node.type === 'version') {
      // Handle version selection - create preview model object
      try {
        console.log('AutodeskFileBrowser: Selected version node:', node);
        console.log('AutodeskFileBrowser: Version ID:', node.id);
        
        // Don't generate URN here - it will be done during translation
        const model: SelectedModel = {
          id: `${node.data.hubId}_${node.data.projectId}_${node.data.itemId}_${node.id}`,
          hubId: node.data.hubId,
          projectId: node.data.projectId,
          itemId: node.data.itemId,
          versionId: node.id,
          name: node.data.itemData.attributes.displayName,
          fileName: node.data.itemData.attributes.fileName,
          fileType: node.data.itemData.attributes.fileType,
          viewerUrn: '', // Will be set after translation
          lastModified: node.data.attributes.lastModifiedTime
        };
        
        console.log('AutodeskFileBrowser: Created model object:', model);
        setSelectedModel(model);
      } catch (error) {
        console.error('AutodeskFileBrowser: Error selecting model:', error);
      }
      return;
    }
    
    if (!node.canExpand) return;
    
    // Toggle expansion
    const newTree = [...tree];
    let targetNode = newTree;
    let currentNode = targetNode[nodePath[0]];
    
    for (let i = 1; i < nodePath.length; i++) {
      currentNode = currentNode.children![nodePath[i]];
    }
    
    currentNode.isExpanded = !currentNode.isExpanded;
    
    // Load children if expanding and not already loaded
    if (currentNode.isExpanded && currentNode.children!.length === 0) {
      console.log(`AutodeskFileBrowser: Loading children for ${currentNode.type}: ${currentNode.name}`);
      currentNode.isLoading = true;
      setTree([...newTree]);
      
      try {
        const children = await loadChildren(currentNode);
        console.log(`AutodeskFileBrowser: Loaded ${children.length} children for ${currentNode.name}`);
        currentNode.children = children;
        currentNode.isLoading = false;
        setTree([...newTree]);
      } catch (error) {
        console.error(`AutodeskFileBrowser: Error loading children for ${currentNode.name}:`, error);
        currentNode.isLoading = false;
        currentNode.isExpanded = false;
        setTree([...newTree]);
        
        // Show error to user
        setError(`Failed to load ${currentNode.type === 'hub' ? 'projects' : 'content'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log(`AutodeskFileBrowser: Node ${currentNode.name} toggled to expanded=${currentNode.isExpanded}`);
      setTree([...newTree]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedModel) {
      onModelSelect(selectedModel);
      onClose();
    }
  };

  const renderNode = (node: TreeNode, level: number = 0, nodePath: number[] = []): React.ReactNode => {
    const getIcon = () => {
      switch (node.type) {
        case 'hub':
          return <Building2 className="w-4 h-4 text-blue-600" />;
        case 'project':
          return <Building2 className="w-4 h-4 text-green-600" />;
        case 'folder':
          return <Folder className="w-4 h-4 text-yellow-600" />;
        case 'item':
          return <File className="w-4 h-4 text-purple-600" />;
        case 'version':
          return <File className="w-4 h-4 text-gray-600" />;
        default:
          return <File className="w-4 h-4" />;
      }
    };

    const isSelected = selectedModel?.versionId === node.id && node.type === 'version';
    const paddingLeft = level * 20 + 12;

    return (
      <div key={node.id}>
        <button
          className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm hover:bg-accent rounded transition-colors ${
            isSelected ? 'bg-primary/10 border border-primary/30' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleNodeClick(node, nodePath)}
        >
          {node.canExpand && (
            <div className="w-4 h-4 flex items-center justify-center">
              {node.isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          
          {getIcon()}
          <span className="flex-1 truncate">{node.name}</span>
          {isSelected && <Link2 className="w-4 h-4 text-primary" />}
        </button>
        
        {node.isExpanded && node.children && (
          <div>
            {node.children.map((child, index) =>
              renderNode(child, level + 1, [...nodePath, index])
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Browse Autodesk Construction Cloud</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {isLoading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading ACC accounts...</span>
            </div>
          ) : tree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No ACC accounts found</p>
              <button
                onClick={loadTree}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node, index) => renderNode(node, 0, [index]))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedModel ? `Selected: ${selectedModel.name}` : 'Select a model version to link'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-input rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedModel}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Link Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}