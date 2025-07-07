'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Loader2,
  X,
  Check
} from 'lucide-react';

interface ModelPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect: (model: SelectedModel) => void;
  isLinking?: boolean;
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

export default function ModelPickerPopup({ isOpen, onClose, onModelSelect, isLinking = false }: ModelPickerPopupProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen]);

  const loadTree = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/autodesk/hubs');
      if (!response.ok) throw new Error('Please authenticate with Autodesk in Settings first.');
      
      const data = await response.json();
      if (!data.hubs || data.hubs.length === 0) {
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
      
      setTree(hubNodes);
    } catch (error) {
      console.error('Error loading ACC accounts:', error);
      setTree([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
    try {
      switch (node.type) {
        case 'hub': {
          const response = await fetch(`/api/autodesk/projects?hubId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error('Failed to load projects');
          const data = await response.json();
          
          return data.projects.map((project: any) => ({
            id: project.id,
            name: project.attributes.name,
            type: 'project' as const,
            data: { ...project, hubId: node.id },
            children: [],
            isExpanded: false,
            canExpand: true
          }));
        }
        
        case 'project': {
          const response = await fetch(`/api/autodesk/folders?hubId=${encodeURIComponent(node.data.hubId)}&projectId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error('Failed to load folders');
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
          if (!response.ok) throw new Error('Failed to load folder contents');
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
                canExpand: true
              };
            }
          });
        }
        
        case 'item': {
          const response = await fetch(`/api/autodesk/versions?projectId=${encodeURIComponent(node.data.projectId)}&itemId=${encodeURIComponent(node.id)}`);
          if (!response.ok) throw new Error('Failed to load versions');
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
      console.error(`Error loading children:`, error);
      return [];
    }
  };

  const handleNodeClick = async (node: TreeNode, nodePath: number[]) => {
    if (node.type === 'version') {
      try {
        // Don't create viewerUrn here - it will be created during translation
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
        
        setSelectedModel(model);
        return;
      } catch (error) {
        console.error('Error creating model selection:', error);
        return;
      }
    }
    
    if (!node.canExpand) return;
    
    const newTree = [...tree];
    let targetNode = newTree;
    let currentNode = targetNode[nodePath[0]];
    
    for (let i = 1; i < nodePath.length; i++) {
      currentNode = currentNode.children![nodePath[i]];
    }
    
    currentNode.isExpanded = !currentNode.isExpanded;
    
    if (currentNode.isExpanded && currentNode.children!.length === 0) {
      currentNode.isLoading = true;
      setTree([...newTree]);
      
      try {
        const children = await loadChildren(currentNode);
        currentNode.children = children;
        currentNode.isLoading = false;
        setTree([...newTree]);
      } catch (error) {
        currentNode.isLoading = false;
        currentNode.isExpanded = false;
        setTree([...newTree]);
      }
    } else {
      setTree([...newTree]);
    }
  };

  const handleConfirm = async () => {
    if (selectedModel) {
      try {
        console.log('ModelPickerPopup: Confirming model selection:', selectedModel);
        await onModelSelect(selectedModel);
      } catch (error) {
        console.error('Error in model selection:', error);
        
        // More detailed error logging
        if (error instanceof Error) {
          console.error('ModelPickerPopup error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        
        // Show error to user
        alert(`Error selecting model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
          className={`w-full flex items-center gap-2 px-2 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
            isSelected ? 'bg-blue-50 border border-blue-200 rounded-md' : ''
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
          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Select Model</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          ) : tree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No ACC accounts found</p>
              <p className="text-xs">Check authentication in Settings</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node, index) => renderNode(node, 0, [index]))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            {selectedModel ? `Selected: ${selectedModel.name}` : 'Choose a model version to continue'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedModel || isLinking}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLinking && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLinking ? 'Linking...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}