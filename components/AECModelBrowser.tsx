'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  File, 
  Loader2, 
  AlertCircle, 
  Search,
  Eye,
  Link2,
  Database,
  Calculator,
  CheckCircle,
  Info
} from 'lucide-react';
import { apsService, type APSProject, type APSHub } from '@/lib/autodesk-aps';
import { aecDataModelService, type AECModelSet, type CarbonCalculationData } from '@/lib/aec-data-model';
import { updateProjectLinkedModel } from '@/lib/actions';
import { type APSModelAssignment } from '@/lib/projectData';

interface AECModelBrowserProps {
  projectId: string;
  optionId: string;
  onModelLinked?: (model: APSModelAssignment) => void;
  onError?: (error: string) => void;
}

interface EnhancedModelSet extends AECModelSet {
  isProcessed: boolean;
  carbonDataAvailable: boolean;
  elementCount?: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function AECModelBrowser({ 
  projectId, 
  optionId, 
  onModelLinked, 
  onError 
}: AECModelBrowserProps) {
  const [hubs, setHubs] = useState<APSHub[]>([]);
  const [selectedHub, setSelectedHub] = useState<APSHub | null>(null);
  const [projects, setProjects] = useState<APSProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<APSProject | null>(null);
  const [modelSets, setModelSets] = useState<EnhancedModelSet[]>([]);
  const [selectedModelSet, setSelectedModelSet] = useState<EnhancedModelSet | null>(null);
  const [carbonData, setCarbonData] = useState<CarbonCalculationData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hubsData = await apsService.getHubs();
      console.log('AEC Browser: Loaded hubs:', hubsData.length);
      setHubs(hubsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load ACC accounts';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHubSelect = async (hub: APSHub) => {
    setSelectedHub(hub);
    setSelectedProject(null);
    setModelSets([]);
    setSelectedModelSet(null);
    setIsLoading(true);

    try {
      console.log('AEC Browser: Loading projects for hub:', hub.id);
      const projectsData = await apsService.getProjects(hub.id);
      console.log('AEC Browser: Loaded projects:', projectsData.length);
      setProjects(projectsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (project: APSProject) => {
    setSelectedProject(project);
    setModelSets([]);
    setSelectedModelSet(null);
    setIsLoading(true);

    try {
      console.log('AEC Browser: Loading model sets for project:', project.id);
      
      // Use AEC Data Model API to get structured model sets
      const modelSetsData = await aecDataModelService.getProjectDesigns(project.id);
      console.log('AEC Browser: Loaded model sets:', modelSetsData.length);
      
      // Enhance model sets with additional analysis
      const enhancedModelSets = await Promise.all(
        modelSetsData.map(async (modelSet) => {
          const enhanced: EnhancedModelSet = {
            ...modelSet,
            isProcessed: modelSet.status === 'ready',
            carbonDataAvailable: false,
            dataQuality: 'fair',
          };

          // Quick analysis to determine data quality
          if (modelSet.status === 'ready') {
            try {
              // Sample a few elements to assess data quality
              const elementsData = await aecDataModelService.getDesignEntities(
 
                modelSet.id, 
                { categories: ['Walls', 'Structural Columns'] }, 
                10
              );
              
              enhanced.elementCount = elementsData.total;
              enhanced.carbonDataAvailable = elementsData.elements.length > 0;
              
              // Assess data quality based on element count and categories
              if (elementsData.total > 1000) {
                enhanced.dataQuality = 'excellent';
              } else if (elementsData.total > 500) {
                enhanced.dataQuality = 'good';
              } else if (elementsData.total > 100) {
                enhanced.dataQuality = 'fair';
              } else {
                enhanced.dataQuality = 'poor';
              }
              
            } catch (analysisError) {
              console.warn('Failed to analyze model set:', analysisError);
            }
          }

          return enhanced;
        })
      );

      setModelSets(enhancedModelSets);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load model sets';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeModelSetCarbon = async (modelSet: EnhancedModelSet) => {
    if (!selectedProject) return;

    setIsAnalyzing(true);
    try {
      console.log('AEC Browser: Analyzing carbon data for model set:', modelSet.id);
      
      // Simple carbon database for demonstration
      // In production, this would come from your carbon database
      const carbonDatabase = new Map([
        ['concrete', 0.150], // kg CO2e per kg
        ['steel', 2.1],
        ['timber', 0.4],
        ['aluminum', 11.5],
        ['glass', 0.85],
      ]);

      const carbonResults = await aecDataModelService.extractCarbonData(
        modelSet.id,
        carbonDatabase
      );

      console.log('AEC Browser: Carbon analysis complete:', carbonResults.length, 'elements');
      setCarbonData(carbonResults);
      
      // Update model set status
      const updatedModelSets = modelSets.map(ms => 
        ms.id === modelSet.id 
          ? { ...ms, carbonDataAvailable: carbonResults.length > 0 }
          : ms
      );
      setModelSets(updatedModelSets);
      
    } catch (error) {
      console.error('Carbon analysis failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to analyze carbon data';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const linkModelSet = async (modelSet: EnhancedModelSet) => {
    if (!selectedProject || !selectedHub) return;

    setIsLinking(true);
    try {
      console.log('AEC Browser: Linking model set:', modelSet.id);

      // Create model assignment following AEC best practices
      const modelAssignment: APSModelAssignment = {
        id: `${modelSet.id}-${Date.now()}`,
        hubId: selectedHub.id,
        projectId: selectedProject.id,
        itemId: modelSet.id, // Using modelSet ID as item ID for AEC models
        versionId: 'latest', // AEC models use latest version by default
        name: modelSet.name,
        fileName: modelSet.sourceFileName,
        fileType: modelSet.type,
        viewerUrn: btoa(modelSet.id).replace(/=/g, ''), // Convert to viewer URN
        thumbnailUrl: '', // Would be generated by Model Derivative API
        lastModified: modelSet.lastModifiedTime,
        assignedAt: new Date().toISOString(),
        status: 'ready',
      };

      // Link the model using server action
      const result = await updateProjectLinkedModel(projectId, optionId, modelAssignment);
      
      if (result.success) {
        console.log('AEC Browser: Model linked successfully');
        onModelLinked?.(modelAssignment);
        setSelectedModelSet(modelSet);
      } else {
        throw new Error(result.error || 'Failed to link model');
      }

    } catch (error) {
      console.error('Model linking failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to link model';
      setError(message);
      onError?.(message);
    } finally {
      setIsLinking(false);
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AEC Model Browser</h3>
          <p className="text-sm text-muted-foreground">
            Browse and link BIM models with carbon calculation support
          </p>
        </div>
        <button
          onClick={loadHubs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hubs & Projects */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">1. Select Project</h4>
          
          {/* Hubs */}
          <div className="border border-input rounded-md">
            <div className="p-3 border-b bg-muted/50">
              <h5 className="text-xs font-medium">ACC Accounts</h5>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {isLoading && !selectedHub ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : (
                hubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => handleHubSelect(hub)}
                    className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                      selectedHub?.id === hub.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{hub.attributes.name}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Projects */}
          {selectedHub && (
            <div className="border border-input rounded-md">
              <div className="p-3 border-b bg-muted/50">
                <h5 className="text-xs font-medium">Projects</h5>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                        selectedProject?.id === project.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{project.attributes.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Model Sets */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">2. Select Model</h4>
          
          <div className="border border-input rounded-md">
            <div className="p-3 border-b bg-muted/50">
              <h5 className="text-xs font-medium">Available Models</h5>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : modelSets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No models found</p>
                </div>
              ) : (
                modelSets.map((modelSet) => (
                  <div
                    key={modelSet.id}
                    className={`p-4 border-b hover:bg-accent transition-colors ${
                      selectedModelSet?.id === modelSet.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h6 className="font-medium text-sm">{modelSet.name}</h6>
                          <p className="text-xs text-muted-foreground">
                            {modelSet.sourceFileName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getDataQualityColor(modelSet.dataQuality)}`}>
                          {modelSet.dataQuality}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{modelSet.type.toUpperCase()}</span>
                        {modelSet.elementCount && (
                          <span>{modelSet.elementCount} elements</span>
                        )}
                        <span>{new Date(modelSet.lastModifiedTime).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => analyzeModelSetCarbon(modelSet)}
                          disabled={isAnalyzing || !modelSet.isProcessed}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          <Calculator className="w-3 h-3" />
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Carbon'}
                        </button>
                        
                        <button
                          onClick={() => linkModelSet(modelSet)}
                          disabled={isLinking || !modelSet.isProcessed}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                          <Link2 className="w-3 h-3" />
                          {isLinking ? 'Linking...' : 'Link Model'}
                        </button>
                      </div>

                      {modelSet.carbonDataAvailable && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Carbon data available
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Carbon Analysis Results */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">3. Carbon Analysis</h4>
          
          <div className="border border-input rounded-md">
            <div className="p-3 border-b bg-muted/50">
              <h5 className="text-xs font-medium">Carbon Data</h5>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {carbonData.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a model and analyze</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Elements:</span>
                      <span className="ml-2 font-medium">{carbonData.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Carbon:</span>
                      <span className="ml-2 font-medium">
                        {carbonData.reduce((sum, item) => sum + item.carbonTotal, 0).toFixed(1)} kg CO2e
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h6 className="text-xs font-medium">By Category:</h6>
                    {Object.entries(
                      carbonData.reduce((acc, item) => {
                        acc[item.category] = (acc[item.category] || 0) + item.carbonTotal;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, total]) => (
                      <div key={category} className="flex justify-between text-xs">
                        <span>{category}</span>
                        <span className="font-medium">{total.toFixed(1)} kg CO2e</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}