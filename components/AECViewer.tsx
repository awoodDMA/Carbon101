'use client';

import { useEffect, useState } from 'react';
import { aecDataModelService } from '@/lib/aec-data-model';
import { AECElement } from '@/lib/aec-data-model';

interface AECViewerProps {
  projectId?: string;
  modelSetId?: string;
  onElementSelect?: (element: AECElement) => void;
}

export default function AECViewer({ projectId, modelSetId, onElementSelect }: AECViewerProps) {
  const [aecElements, setAECElements] = useState<AECElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<AECElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAECData = async () => {
    if (!modelSetId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('AEC Viewer: Loading AEC data for model set:', modelSetId);
      
      // Load all elements with their properties for carbon analysis
      const elementsData = await aecDataModelService.getDesignEntities(
        modelSetId,
        undefined, // No filter initially
        1000 // Load more elements for comprehensive data
      );

      console.log('AEC Viewer: Loaded AEC elements:', elementsData.elements.length);
      setAECElements(elementsData.elements);

    } catch (error) {
      console.error('AEC Viewer: Failed to load AEC data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load AEC data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAECData();
  }, [modelSetId]);

  const handleElementSelect = (element: AECElement) => {
    // GraphQL provides properties directly with design entities
    setSelectedElement(element);
    onElementSelect?.(element);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading AEC data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p className="text-sm font-medium">Failed to load AEC data</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!modelSetId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No model set selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">AEC Data Model</h3>
        <p className="text-sm text-muted-foreground">
          {aecElements.length} elements loaded
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {aecElements.map((element) => (
            <div
              key={element.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedElement?.id === element.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleElementSelect(element)}
            >
              <div className="font-medium text-sm">{element.name}</div>
              <div className="text-xs text-muted-foreground">
                Category: {element.category}
                {element.family && ` • Family: ${element.family}`}
              </div>
              {element.geometry && (
                <div className="text-xs text-muted-foreground mt-1">
                  {element.geometry.volume && `Volume: ${element.geometry.volume.toFixed(2)}`}
                  {element.geometry.area && ` • Area: ${element.geometry.area.toFixed(2)}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedElement && (
        <div className="p-4 border-t bg-muted/50">
          <h4 className="font-medium text-sm mb-2">Element Properties</h4>
          <div className="space-y-1 max-h-32 overflow-auto">
            {selectedElement.properties.map((prop, index) => (
              <div key={index} className="text-xs">
                <span className="font-medium">{prop.displayName}:</span>{' '}
                <span className="text-muted-foreground">{prop.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}