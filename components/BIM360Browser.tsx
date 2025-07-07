'use client';

import { useState, useEffect } from 'react';
import { X, Folder, File, ChevronRight, ChevronDown, Building, Loader2, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apsService, type APSHub, type APSProject, type APSFolder, type APSItem, type APSVersion } from '@/lib/autodesk-aps';

interface BIM360BrowserProps {
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
  type: 'hub' | 'project' | 'folder' | 'item';
  data?: any;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
}

export default function BIM360Browser({ isOpen, onClose, onModelSelect }: BIM360BrowserProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHubs();
    }
  }, [isOpen]);

  const loadHubs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hubs = await apsService.getHubs();
      const hubNodes: TreeNode[] = hubs.map(hub => ({
        id: hub.id,
        name: hub.attributes.name,
        type: 'hub',
        data: hub,
        children: [],
        isExpanded: false,
        hasChildren: true
      }));
      setTree(hubNodes);
    } catch (error) {
      setError('Failed to load hubs. Please ensure you are authenticated with Autodesk.');
      console.error('Error loading hubs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async (hubNode: TreeNode) => {
    if (!hubNode.data) return;
    
    setTree(prev => prev.map(node => 
      node.id === hubNode.id ? { ...node, isLoading: true } : node
    ));

    try {
      const projects = await apsService.getProjects(hubNode.id);
      const projectNodes: TreeNode[] = projects.map(project => ({
        id: project.id,
        name: project.attributes.name,
        type: 'project',
        data: { ...project, hubId: hubNode.id },
        children: [],
        isExpanded: false,
        hasChildren: true
      }));

      setTree(prev => prev.map(node => 
        node.id === hubNode.id 
          ? { ...node, children: projectNodes, isExpanded: true, isLoading: false }
          : node
      ));
    } catch (error) {
      console.error('Error loading projects:', error);
      setTree(prev => prev.map(node => 
        node.id === hubNode.id ? { ...node, isLoading: false } : node
      ));
    }
  };

  const loadFolders = async (projectNode: TreeNode, parentPath: TreeNode[] = []) => {
    if (!projectNode.data) return;

    const updatePath = [...parentPath, projectNode];
    setTree(prev => updateNodeInTree(prev, updatePath, { isLoading: true }));

    try {
      const folders = await apsService.getProjectTopFolders(projectNode.data.hubId, projectNode.id);
      const folderNodes: TreeNode[] = folders.map(folder => ({
        id: folder.id,
        name: folder.attributes.displayName || folder.attributes.name,
        type: 'folder',
        data: { ...folder, hubId: projectNode.data.hubId, projectId: projectNode.id },
        children: [],
        isExpanded: false,
        hasChildren: true
      }));

      setTree(prev => updateNodeInTree(prev, updatePath, { 
        children: folderNodes, 
        isExpanded: true, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error loading folders:', error);
      setTree(prev => updateNodeInTree(prev, updatePath, { isLoading: false }));
    }
  };

  const loadFolderContents = async (folderNode: TreeNode, parentPath: TreeNode[] = []) => {
    if (!folderNode.data) return;

    const updatePath = [...parentPath, folderNode];
    setTree(prev => updateNodeInTree(prev, updatePath, { isLoading: true }));

    try {
      const contents = await apsService.getFolderContents(folderNode.data.projectId, folderNode.id);
      const contentNodes: TreeNode[] = contents.map(item => {
        if (item.type === 'folders') {
          return {
            id: item.id,
            name: item.attributes.displayName || (item.attributes as any).name,
            type: 'folder',
            data: { ...item, hubId: folderNode.data.hubId, projectId: folderNode.data.projectId },
            children: [],
            isExpanded: false,
            hasChildren: true
          };
        } else {
          // Item/File
          const fileItem = item as APSItem;
          return {
            id: fileItem.id,
            name: fileItem.attributes.displayName,
            type: 'item',
            data: { ...fileItem, hubId: folderNode.data.hubId, projectId: folderNode.data.projectId },
            children: [],
            isExpanded: false,
            hasChildren: false
          };
        }
      });

      setTree(prev => updateNodeInTree(prev, updatePath, { 
        children: contentNodes, 
        isExpanded: true, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error loading folder contents:', error);
      setTree(prev => updateNodeInTree(prev, updatePath, { isLoading: false }));
    }
  };

  const updateNodeInTree = (nodes: TreeNode[], path: TreeNode[], updates: Partial<TreeNode>): TreeNode[] => {
    if (path.length === 0) return nodes;
    
    const [current, ...rest] = path;
    return nodes.map(node => {
      if (node.id === current.id) {
        if (rest.length === 0) {
          return { ...node, ...updates };
        } else {
          return {
            ...node,
            children: node.children ? updateNodeInTree(node.children, rest, updates) : []
          };
        }
      }
      return node;
    });
  };

  const handleNodeClick = async (node: TreeNode, parentPath: TreeNode[] = []) => {
    if (node.type === 'item') {
      // Handle model selection
      await selectModel(node);
      return;
    }

    if (!node.isExpanded && node.hasChildren) {
      switch (node.type) {
        case 'hub':
          await loadProjects(node);
          break;
        case 'project':
          await loadFolders(node, parentPath);
          break;
        case 'folder':
          await loadFolderContents(node, parentPath);
          break;
      }
    } else {
      // Collapse node
      const updatePath = [...parentPath, node];
      setTree(prev => updateNodeInTree(prev, updatePath, { isExpanded: !node.isExpanded }));
    }
  };

  const selectModel = async (itemNode: TreeNode) => {
    if (!itemNode.data) return;

    try {
      // Get the latest version of the item
      const versions = await apsService.getItemVersions(itemNode.data.projectId, itemNode.id);
      if (versions.length === 0) {
        setError('No versions found for this model.');
        return;
      }

      const latestVersion = versions[0]; // First version is typically the latest
      const viewerUrn = apsService.getViewerUrn(latestVersion.id);
      
      const model: SelectedModel = {
        id: `${itemNode.data.hubId}_${itemNode.data.projectId}_${itemNode.id}_${latestVersion.id}`,
        hubId: itemNode.data.hubId,
        projectId: itemNode.data.projectId,
        itemId: itemNode.id,
        versionId: latestVersion.id,
        name: itemNode.name,
        fileName: itemNode.data.attributes.fileName,
        fileType: itemNode.data.attributes.fileType,
        viewerUrn,
        lastModified: latestVersion.attributes.lastModifiedTime
      };

      setSelectedModel(model);
    } catch (error) {
      setError('Failed to load model versions.');
      console.error('Error selecting model:', error);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedModel) {
      onModelSelect(selectedModel);
      onClose();
    }
  };

  const renderTreeNode = (node: TreeNode, level: number = 0, parentPath: TreeNode[] = []): React.ReactNode => {
    const getIcon = () => {
      switch (node.type) {
        case 'hub':
          return <Building className="w-4 h-4 text-blue-600" />;
        case 'project':
          return <Folder className="w-4 h-4 text-green-600" />;
        case 'folder':
          return <Folder className="w-4 h-4 text-yellow-600" />;
        case 'item':
          return <File className="w-4 h-4 text-gray-600" />;
        default:
          return <File className="w-4 h-4" />;
      }
    };

    const canExpand = node.hasChildren && !node.isLoading;
    const isSelected = selectedModel?.itemId === node.id && node.type === 'item';

    return (
      <div key={node.id}>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent rounded-md transition-colors',
            isSelected && 'bg-primary/10 border border-primary/30'
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleNodeClick(node, parentPath)}
        >
          {canExpand && (
            <div className="w-4 h-4 flex items-center justify-center">
              {node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          {node.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            getIcon()
          )}
          <span className="flex-1 truncate">{node.name}</span>
          {isSelected && <Link className="w-4 h-4 text-primary" />}
        </button>
        {node.isExpanded && node.children && (
          <div>
            {node.children.map(child => 
              renderTreeNode(child, level + 1, [...parentPath, node])
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Browse Autodesk Models</h2>
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
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isLoading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading hubs...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {selectedModel ? `Selected: ${selectedModel.name}` : 'Select a model to link'}
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