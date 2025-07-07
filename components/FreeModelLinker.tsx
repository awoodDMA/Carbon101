/**
 * Free Model Linker Component
 * 
 * This component replaces ModelLinker and uses ONLY FREE APIs:
 * - AEC Data Model API for design data
 * - Data Management API for file browsing
 * - No Model Derivative API (no translation costs)
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, AlertCircle, CheckCircle, Eye, FileText } from 'lucide-react';
import { aecViewerService, ViewableModel } from '@/lib/aec-viewer-service';
import { aecDataModelService, AECModelSet } from '@/lib/aec-data-model';

interface FreeModelLinkerProps {
  projectId: string;
  optionId: string;
  onModelLinked?: (modelData: any) => void;
  onClose?: () => void;
}

export default function FreeModelLinker({
  projectId,
  optionId,
  onModelLinked,
  onClose
}: FreeModelLinkerProps) {
  const [designs, setDesigns] = useState<AECModelSet[]>([]);
  const [viewableModels, setViewableModels] = useState<Map<string, ViewableModel>>(new Map());
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableDesigns();
  }, [projectId]);

  const loadAvailableDesigns = async () => {
    console.log('🔍 FreeModelLinker: Loading designs for project:', projectId);
    setLoading(true);
    setError(null);

    try {
      // Get all designs for the project using FREE AEC Data Model API
      const projectDesigns = await aecDataModelService.getProjectDesigns(projectId);
      console.log('📊 FreeModelLinker: Found designs:', projectDesigns.length);
      
      setDesigns(projectDesigns);

      // Check which designs are viewable (without triggering translation)
      const viewableMap = new Map<string, ViewableModel>();
      
      for (const design of projectDesigns) {
        console.log('🔍 FreeModelLinker: Checking viewability of:', design.name);
        const viewableModel = await aecViewerService.getViewableModel(projectId, design.id);
        viewableMap.set(design.id, viewableModel);
      }
      
      setViewableModels(viewableMap);
      console.log('✅ FreeModelLinker: Viewability check complete');

    } catch (err) {
      console.error('❌ FreeModelLinker: Error loading designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkModel = async (design: AECModelSet) => {
    const viewableModel = viewableModels.get(design.id);
    
    if (!viewableModel?.isViewable) {
      setError('This model cannot be viewed without translation. Only pre-processed models are supported in free mode.');
      return;
    }

    console.log('🔗 FreeModelLinker: Linking model:', design.name);
    setLinking(design.id);
    setError(null);

    try {
      // Link the model using only FREE APIs
      const linkingData = await aecViewerService.linkModelToOption(
        projectId,
        optionId,
        design.id,
        design.name
      );

      console.log('✅ FreeModelLinker: Model linked successfully');
      
      // Return the linking data to parent component
      onModelLinked?.({
        designId: design.id,
        modelName: design.name,
        viewerUrn: viewableModel.viewerUrn,
        status: 'ready',
        isViewable: true,
        usedFreeAPI: true
      });

      onClose?.();

    } catch (err) {
      console.error('❌ FreeModelLinker: Error linking model:', err);
      setError(err instanceof Error ? err.message : 'Failed to link model');
    } finally {
      setLinking(null);
    }
  };

  const getStatusColor = (status: string, isViewable: boolean) => {
    if (!isViewable) return 'bg-red-100 text-red-800';
    if (status === 'ready') return 'bg-green-100 text-green-800';
    if (status === 'processing') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string, isViewable: boolean) => {
    if (!isViewable) return <AlertCircle className="w-4 h-4" />;
    if (status === 'ready') return <CheckCircle className="w-4 h-4" />;
    if (status === 'processing') return <Loader2 className="w-4 h-4 animate-spin" />;
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Available Models</CardTitle>
          <CardDescription>
            Searching for viewable models using FREE AEC Data Model API...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading designs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button 
            onClick={loadAvailableDesigns} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const viewableDesigns = designs.filter(design => 
    viewableModels.get(design.id)?.isViewable
  );

  const nonViewableDesigns = designs.filter(design => 
    !viewableModels.get(design.id)?.isViewable
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Model to Option</CardTitle>
        <CardDescription>
          Select a model that's ready for viewing. Only models processed through AEC Data Model are available in free mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {viewableDesigns.length === 0 && nonViewableDesigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No designs found in this project.</p>
            <p className="text-sm mt-2">
              Make sure models have been uploaded and processed through AEC Data Model.
            </p>
          </div>
        )}

        {/* Viewable Models */}
        {viewableDesigns.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-green-700 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Ready for Viewing ({viewableDesigns.length})
            </h4>
            <div className="space-y-3">
              {viewableDesigns.map((design) => {
                const viewableModel = viewableModels.get(design.id);
                const isLinking = linking === design.id;

                return (
                  <div
                    key={design.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="font-medium">{design.name}</h5>
                        <Badge 
                          className={getStatusColor(viewableModel?.status || '', true)}
                        >
                          {getStatusIcon(viewableModel?.status || '', true)}
                          <span className="ml-1">Ready</span>
                        </Badge>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          FREE
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {design.sourceFileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {viewableModel?.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewableModel?.viewerUrn && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            // Preview functionality could be added here
                            console.log('Preview:', viewableModel.viewerUrn);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                      )}
                      <Button
                        onClick={() => handleLinkModel(design)}
                        disabled={isLinking}
                        className="flex items-center gap-1"
                      >
                        {isLinking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {isLinking ? 'Linking...' : 'Link Model'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Non-Viewable Models */}
        {nonViewableDesigns.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-600 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Not Available in Free Mode ({nonViewableDesigns.length})
            </h4>
            <div className="space-y-2">
              {nonViewableDesigns.slice(0, 3).map((design) => {
                const viewableModel = viewableModels.get(design.id);

                return (
                  <div
                    key={design.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="font-medium text-gray-700">{design.name}</h5>
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Requires Translation
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{design.sourceFileName}</p>
                      <p className="text-xs text-gray-500">
                        {viewableModel?.message || 'Needs Model Derivative API (premium)'}
                      </p>
                    </div>
                    <Button disabled variant="outline" size="sm">
                      Not Available
                    </Button>
                  </div>
                );
              })}
              {nonViewableDesigns.length > 3 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  + {nonViewableDesigns.length - 3} more models require translation
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Free Mode Benefits</h4>
              <p className="text-sm text-blue-700 mt-1">
                This component uses only FREE Autodesk APIs. Models that have been processed 
                through AEC Data Model can be viewed without additional translation costs.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={loadAvailableDesigns} variant="outline">
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}