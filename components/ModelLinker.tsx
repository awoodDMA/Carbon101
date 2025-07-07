'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Link2,
  Eye,
  Check,
  Search
} from 'lucide-react';
import { 
  apsService, 
  type APSHub, 
  type APSProject, 
  type APSFolder, 
  type APSItem, 
  type APSVersion,
  type APSModelAssignment 
} from '@/lib/autodesk-aps';
import { updateProjectLinkedModel } from '@/lib/actions';

interface ModelLinkerProps {
  projectId: string;
  optionId: string;
  currentLinkedModel?: APSModelAssignment;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'hub' | 'project' | 'folder' | 'item';
  data: APSHub | APSProject | APSFolder | APSItem;
  children?: TreeNode[];
  expanded?: boolean;
  loading?: boolean;
}

export default function ModelLinker({ 
  projectId, 
  optionId, 
  currentLinkedModel
}: ModelLinkerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<APSItem | null>(null);
  const [itemVersions, setItemVersions] = useState<APSVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [linkedModel, setLinkedModel] = useState<APSModelAssignment | undefined>(currentLinkedModel);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/autodesk/hubs');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated with Autodesk. Please authenticate in Settings.');
        }
        throw new Error('Failed to load ACC accounts');
      }
      
      const data = await response.json();
      const hubNodes: TreeNode[] = data.hubs.map((hub: APSHub) => ({
        id: hub.id,
        name: hub.attributes.name,
        type: 'hub',
        data: hub,
        children: [], // Initialize as empty array to allow expansion
        expanded: false,
      }));
      
      console.log('Loaded hubs:', hubNodes.map(h => ({ id: h.id, name: h.name })));

      setTree(hubNodes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load ACC accounts. Please check your authentication in Settings.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async (hubId: string) => {
    console.log('loadProjects: Starting to load projects for hubId:', hubId);
    
    try {
      // First check authentication status
      console.log('loadProjects: Checking auth status...');
      const authResponse = await fetch('/api/debug/auth');
      const authData = await authResponse.json();
      console.log('loadProjects: Auth status:', authData);
      
      // Now try to load projects
      const url = `/api/autodesk/projects?hubId=${encodeURIComponent(hubId)}`;
      console.log('loadProjects: Fetching from:', url);
      
      const response = await fetch(url);
      console.log('loadProjects: Response status:', response.status);
      console.log('loadProjects: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('loadProjects: Error response:', errorText);
        throw new Error(`Failed to load projects: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('loadProjects: Raw response data:', data);
      
      if (!data.projects) {
        console.error('loadProjects: No projects property in response');
        return [];
      }
      
      const projectNodes = data.projects.map((project: APSProject) => ({
        id: project.id,
        name: project.attributes.name,
        type: 'project' as const,
        data: project,
        children: [],
        expanded: false,
      }));
      
      console.log('loadProjects: Mapped project nodes:', projectNodes);
      return projectNodes;
    } catch (error) {
      console.error('loadProjects: Caught error:', error);
      return [];
    }
  };

  const loadTopFolders = async (hubId: string, projectId: string) => {
    try {
      const response = await fetch(`/api/autodesk/folders?hubId=${hubId}&projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to load top folders');
      
      const data = await response.json();
      return data.folders.map((folder: APSFolder) => ({
        id: folder.id,
        name: folder.attributes.displayName,
        type: 'folder' as const,
        data: folder,
        children: [],
        expanded: false,
      }));
    } catch (error) {
      console.error('Failed to load top folders:', error);
      return [];
    }
  };

  const loadFolderContents = async (projectId: string, folderId: string) => {
    try {
      const response = await fetch(`/api/autodesk/folders?projectId=${projectId}&folderId=${folderId}`);
      if (!response.ok) throw new Error('Failed to load folder contents');
      
      const data = await response.json();
      return data.contents.map((item: APSFolder | APSItem) => ({
        id: item.id,
        name: item.type === 'folders' ? 
          (item as APSFolder).attributes.displayName : 
          (item as APSItem).attributes.displayName,
        type: item.type === 'folders' ? 'folder' as const : 'item' as const,
        data: item,
        children: item.type === 'folders' ? [] : undefined,
        expanded: false,
      }));
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      return [];
    }
  };

  const handleNodeToggle = async (nodePath: number[]) => {
    setTree(prevTree => {
      const newTree = [...prevTree];
      let currentNode = newTree[nodePath[0]];

      // Navigate to the target node
      for (let i = 1; i < nodePath.length; i++) {
        currentNode = currentNode.children![nodePath[i]];
      }

      // Toggle expansion
      currentNode.expanded = !currentNode.expanded;
      console.log(`Toggling ${currentNode.type} ${currentNode.name}: expanded=${currentNode.expanded}, children.length=${currentNode.children?.length}`);

      // Load children if expanding and not already loaded
      if (currentNode.expanded && currentNode.children!.length === 0) {
        currentNode.loading = true;
        
        (async () => {
          try {
            let children: TreeNode[] = [];

            console.log(`Loading children for ${currentNode.type}: ${currentNode.name} (ID: ${currentNode.id})`);

            if (currentNode.type === 'hub') {
              children = await loadProjects(currentNode.id);
              console.log(`Loaded ${children.length} projects for hub ${currentNode.name}`);
            } else if (currentNode.type === 'project') {
              const project = currentNode.data as APSProject;
              const hubId = project.relationships.hub.data.id;
              children = await loadTopFolders(hubId, currentNode.id);
              console.log(`Loaded ${children.length} folders for project ${currentNode.name}`);
            } else if (currentNode.type === 'folder') {
              const folder = currentNode.data as APSFolder;
              const projectIdFromFolder = extractProjectIdFromFolder(folder);
              if (projectIdFromFolder) {
                children = await loadFolderContents(projectIdFromFolder, currentNode.id);
                console.log(`Loaded ${children.length} items for folder ${currentNode.name}`);
              }
            }

            setTree(prevTree => {
              console.log('Tree update: Setting children for node path:', nodePath);
              console.log('Tree update: Previous tree length:', prevTree.length);
              console.log('Tree update: Children to set:', children.length);
              
              const updatedTree = [...prevTree];
              let targetNode = updatedTree[nodePath[0]];
              for (let i = 1; i < nodePath.length; i++) {
                targetNode = targetNode.children![nodePath[i]];
              }
              targetNode.children = children;
              targetNode.loading = false;
              
              console.log('Tree update: Updated target node:', {
                name: targetNode.name,
                type: targetNode.type,
                expanded: targetNode.expanded,
                childrenCount: targetNode.children?.length || 0
              });
              console.log('Tree update: Returning updated tree');
              
              return updatedTree;
            });
          } catch (error) {
            console.error(`Error loading children for ${currentNode.type} ${currentNode.name}:`, error);
            setTree(prevTree => {
              const updatedTree = [...prevTree];
              let targetNode = updatedTree[nodePath[0]];
              for (let i = 1; i < nodePath.length; i++) {
                targetNode = targetNode.children![nodePath[i]];
              }
              targetNode.loading = false;
              targetNode.expanded = false; // Collapse on error
              return updatedTree;
            });
          }
        })();
      }

      return newTree;
    });
  };

  const extractProjectIdFromFolder = (folder: APSFolder): string | null => {
    const folderId = folder.id;
    if (folderId.includes('projects/')) {
      const match = folderId.match(/projects\/([^\/]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const handleItemSelect = async (item: APSItem) => {
    setSelectedItem(item);
    setLoadingVersions(true);
    setItemVersions([]);

    try {
      const projectIdFromItem = extractProjectIdFromItem(item);
      if (projectIdFromItem) {
        const response = await fetch(`/api/autodesk/versions?projectId=${projectIdFromItem}&itemId=${item.id}`);
        if (!response.ok) throw new Error('Failed to load item versions');
        
        const data = await response.json();
        setItemVersions(data.versions);
      }
    } catch (error) {
      console.error('Failed to load item versions:', error);
    } finally {
      setLoadingVersions(false);
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
    try {
      console.log('🔗 ModelLinker: Starting model linking process for:', item.attributes.displayName);
      
      const projectIdFromItem = extractProjectIdFromItem(item);
      if (!projectIdFromItem) {
        throw new Error('Could not extract project ID from item');
      }

      console.log('🚀 ModelLinker: Requesting model translation via API...');
      
      // Use the new translation API endpoint
      const translationResponse = await fetch('/api/autodesk/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectIdFromItem,
          versionId: version.id
        })
      });

      if (!translationResponse.ok) {
        const errorData = await translationResponse.json();
        throw new Error(errorData.error || 'Translation request failed');
      }

      const translationData = await translationResponse.json();
      console.log('✅ ModelLinker: Translation API response:', translationData);

      if (!translationData.success) {
        throw new Error(translationData.error || 'Translation failed');
      }

      const { viewerUrn, status, thumbnailUrl, message } = translationData.data;

      // Show user-friendly status message
      if (status === 'inprogress') {
        console.log('⏳ ModelLinker:', message);
      } else if (status === 'success') {
        console.log('✅ ModelLinker:', message);
      }

      const newLinkedModel: APSModelAssignment = {
        id: `${item.id}-${version.id}`,
        hubId: '', // Will be filled from context
        projectId: projectIdFromItem,
        itemId: item.id,
        versionId: version.id,
        name: item.attributes.displayName,
        fileName: item.attributes.fileName,
        fileType: item.attributes.fileType,
        viewerUrn,
        thumbnailUrl: thumbnailUrl || '',
        lastModified: version.attributes.lastModifiedTime,
        assignedAt: new Date().toISOString(),
        status: status === 'success' ? 'ready' : 'processing',
      };

      setLinkedModel(newLinkedModel);
      
      // Use Server Action (now properly configured for Codespaces)
      console.log('🚀 Client: Calling server action with parameters:', {
        projectId,
        optionId,
        newLinkedModel: {
          id: newLinkedModel.id,
          name: newLinkedModel.name,
          fileName: newLinkedModel.fileName,
          status: newLinkedModel.status
        }
      });
      
      const result = await updateProjectLinkedModel(projectId, optionId, newLinkedModel);
      
      console.log('📨 Client: Server action result:', result);
      
      if (!result.success) {
        console.error('❌ Client: Server action failed:', result.error);
        throw new Error(result.error || 'Failed to link model');
      }
      
      console.log('✅ Client: Model linked successfully');
    } catch (error) {
      console.error('Failed to link model:', error);
      setLinkedModel(currentLinkedModel);
    } finally {
      setIsLinking(false);
    }
  };

  const renderTreeNode = (node: TreeNode, path: number[]) => {
    // Hubs and projects can have children, folders may have children, items cannot
    const canHaveChildren = node.type === 'hub' || node.type === 'project' || node.type === 'folder';
    const hasChildren = node.children !== undefined;
    const isExpanded = node.expanded;
    const indent = path.length * 20;

    return (
      <div key={node.id}>
        <div 
          className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer"
          style={{ paddingLeft: `${12 + indent}px` }}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (canHaveChildren) {
              handleNodeToggle(path);
            } else if (node.type === 'item') {
              handleItemSelect(node.data as APSItem);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (canHaveChildren) {
                handleNodeToggle(path);
              } else if (node.type === 'item') {
                handleItemSelect(node.data as APSItem);
              }
            }
          }}
        >
          {canHaveChildren && (
            <div className="w-4 h-4 mr-1 flex items-center justify-center">
              {node.loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          
          {node.type === 'hub' && <Building2 className="w-4 h-4 mr-2 text-blue-600" />}
          {node.type === 'project' && <Building2 className="w-4 h-4 mr-2 text-green-600" />}
          {node.type === 'folder' && <FolderOpen className="w-4 h-4 mr-2 text-yellow-600" />}
          {node.type === 'item' && <File className="w-4 h-4 mr-2 text-gray-600" />}
          
          <span className="text-sm truncate flex-1">{node.name}</span>
        </div>

        {hasChildren && isExpanded && node.children && (
          <div>
            {node.children.map((child, index) => 
              renderTreeNode(child, [...path, index])
            )}
          </div>
        )}
      </div>
    );
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Browse ACC Projects</h3>
        <div className="flex gap-2">
          <button
            onClick={loadHubs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            Browse ACC Files
          </button>
          <button
            onClick={loadHubs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {tree.length > 0 && (
            <button
              onClick={async () => {
                console.log('Test button: Manually expanding first hub...');
                const firstHub = tree[0];
                if (firstHub) {
                  console.log('Test button: First hub:', firstHub);
                  await handleNodeToggle([0]);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              🔧 Test Expand Hub
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project Browser */}
        <div>
          <h4 className="text-sm font-medium mb-3">Browse Projects</h4>
          <div className="border border-input rounded-md bg-card max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : tree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm mb-2">No ACC accounts found</p>
                <p className="text-xs mb-4">Make sure you&apos;re authenticated with Autodesk</p>
                <button
                  onClick={loadHubs}
                  className="flex items-center gap-2 mx-auto px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Connect to ACC
                </button>
              </div>
            ) : (
              <div className="p-2">
                {tree.map((node, index) => renderTreeNode(node, [index]))}
              </div>
            )}
          </div>
        </div>

        {/* Model Versions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Select Model Version</h4>
          <div className="border border-input rounded-md bg-card max-h-96 overflow-y-auto">
            {selectedItem ? (
              <div className="p-4">
                <div className="mb-4">
                  <h5 className="font-medium">{selectedItem.attributes.displayName}</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.attributes.fileName}
                  </p>
                </div>

                {loadingVersions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading versions...</span>
                  </div>
                ) : itemVersions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No versions found</p>
                ) : (
                  <div className="space-y-2">
                    {itemVersions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-3 border border-input rounded hover:bg-accent"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            Version {version.attributes.versionNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(version.attributes.createTime).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleLinkModel(selectedItem, version)}
                          disabled={isLinking}
                          className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          <Link2 className="w-3 h-3" />
                          {isLinking ? 'Linking...' : 'Link Model'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a model from the project browser</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}