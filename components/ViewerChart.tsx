'use client';

import { useState, useEffect } from 'react';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AutodeskViewer from './AutodeskViewer';
import SimpleAutodeskViewer from './SimpleAutodeskViewer';
import type { APSModelAssignment } from '@/lib/projectData';

interface System {
  id: string;
  name: string;
  carbon: number;
  color: string;
  percentage: number;
}

interface ViewerChartProps {
  className?: string;
  systems?: System[];
  linkedModel?: APSModelAssignment;
  accessToken?: string;
}

export default function ViewerChart({ className, systems, linkedModel, accessToken }: ViewerChartProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | undefined>(accessToken);

  const defaultSystems = [
    { id: 'foundation', name: 'Foundation', carbon: 45, color: '#3B82F6', percentage: 18 },
    { id: 'structure', name: 'Structure', carbon: 89, color: '#10B981', percentage: 36 },
    { id: 'envelope', name: 'Envelope', carbon: 67, color: '#F59E0B', percentage: 27 },
    { id: 'mechanical', name: 'Mechanical', carbon: 34, color: '#EF4444', percentage: 14 },
    { id: 'electrical', name: 'Electrical', carbon: 12, color: '#8B5CF6', percentage: 5 },
  ];

  const displaySystems = systems || defaultSystems;
  const totalCarbon = displaySystems.reduce((sum, system) => sum + system.carbon, 0);

  // Debug logging
  useEffect(() => {
    console.log('ViewerChart: Component mounted/updated');
    console.log('ViewerChart: linkedModel:', linkedModel);
    console.log('ViewerChart: linkedModel.viewerUrn:', linkedModel?.viewerUrn);
    console.log('ViewerChart: accessTokenState:', accessTokenState ? 'Present' : 'None');
  }, [linkedModel, accessTokenState]);

  // Fetch access token if not provided
  useEffect(() => {
    if (!accessTokenState && linkedModel) {
      console.log('ViewerChart: Fetching access token for linkedModel...');
      // Fetch access token from API
      fetch('/api/auth/autodesk/token')
        .then(response => {
          console.log('ViewerChart: Access token response status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('ViewerChart: Access token response:', data);
          if (data.access_token) {
            console.log('ViewerChart: Setting access token');
            setAccessTokenState(data.access_token);
          } else {
            console.error('ViewerChart: No access token in response');
          }
        })
        .catch(error => console.error('ViewerChart: Failed to get access token:', error));
    }
  }, [accessTokenState, linkedModel]);

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[3fr_2fr]', className)}>
      {/* 3D Viewer */}
      <div className="relative bg-muted rounded-lg overflow-hidden min-h-[300px] lg:min-h-[400px]">
        {linkedModel?.status === 'ready' && linkedModel.viewerUrn && accessTokenState ? (
          <SimpleAutodeskViewer
            urn={linkedModel.viewerUrn.startsWith('urn:') ? linkedModel.viewerUrn : `urn:${linkedModel.viewerUrn}`}
            accessToken={accessTokenState}
            width="100%"
            height="100%"
            onDocumentLoad={(doc) => {
              console.log('ViewerChart: Document loaded:', doc);
            }}
            onGeometryLoad={(model) => {
              console.log('ViewerChart: Geometry loaded - ready for quantity takeoff');
            }}
            onError={(error) => {
              console.error('ViewerChart: Viewer error:', error);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Maximize2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {!linkedModel ? 'No Model Linked' : 
                 linkedModel.status === 'processing' ? 'Model Processing' :
                 linkedModel.status === 'failed' ? 'Model Failed' :
                 !accessTokenState ? 'Loading Access Token' :
                 'No Model Available'}
              </p>
              <p className="text-xs text-gray-600">
                {!linkedModel ? 'Use "Link Model" to connect an Autodesk model' :
                 linkedModel.status === 'processing' ? 'Model translation is in progress' :
                 linkedModel.status === 'failed' ? 'Model translation failed' :
                 !accessTokenState ? 'Fetching authentication token...' :
                 'Model not ready for viewing'}
              </p>
            </div>
          </div>
        )}

        {/* System Selection Overlay */}
        {linkedModel && (
          <div className="absolute top-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Linked Model</span>
              </div>
              <p className="text-xs text-gray-600">{linkedModel.name}</p>
            </div>
          </div>
        )}

        {/* Additional Viewer Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            className="p-2 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Selection overlay */}
        {selectedSystem && (
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-md text-sm">
            Selected: {displaySystems.find(s => s.id === selectedSystem)?.name}
          </div>
        )}
      </div>

      {/* Doughnut Chart */}
      <div className="bg-card rounded-lg border p-4 lg:p-6">
        <h3 className="font-semibold mb-4">Embodied Carbon by System</h3>
        
        {/* Chart center with total */}
        <div className="relative flex items-center justify-center mb-6">
          <svg width="200" height="200" className="rotate-[-90deg]">
            {displaySystems.map((system, index) => {
              const radius = 80;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (system.percentage / 100) * circumference;
              
              // Calculate rotation for each segment
              const previousPercentages = displaySystems.slice(0, index).reduce((sum, s) => sum + s.percentage, 0);
              const rotation = (previousPercentages / 100) * 360;

              return (
                <circle
                  key={system.id}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={system.color}
                  strokeWidth="20"
                  strokeDasharray={`${(system.percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset="0"
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    selectedSystem === system.id && 'stroke-[24]'
                  )}
                  style={{
                    transformOrigin: '100px 100px',
                    transform: `rotate(${rotation}deg)`,
                  }}
                  onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold carbon-value">{totalCarbon}</div>
            <div className="text-sm text-muted-foreground">tCO₂e</div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {displaySystems.map((system) => (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-md transition-colors hover:bg-accent',
                selectedSystem === system.id && 'bg-accent border border-primary/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: system.color }}
                />
                <span className="text-sm font-medium">{system.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium carbon-value">{system.carbon} tCO₂e</div>
                <div className="text-xs text-muted-foreground">{system.percentage}%</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}