'use client';

import { useState } from 'react';

interface System {
  id: string;
  name: string;
  carbon: number;
  color?: string; // Optional since we'll force brand colors
  percentage: number;
}

interface EmbodiedCarbonChartProps {
  systems?: System[];
}

export default function EmbodiedCarbonChart({ systems }: EmbodiedCarbonChartProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  
  // Debug logging
  console.log('📊 EmbodiedCarbonChart received systems prop:', systems);

  // Brand color palette reordered for maximum contrast between adjacent segments
  const brandColors = [
    '#FF8E60', '#E1D5D3', '#F18051', '#F8B89B', '#E7904F', 
    '#ECE9E8', '#D4A451', '#DBCBC9', '#FF7B41', '#F3F3F3',
    '#E09C4E', '#E6DFDD', '#D5AE46', '#FBA37D', '#F2C8B9'
  ];

  const defaultSystems = [
    { id: 'foundation', name: 'Foundation', carbon: 45, percentage: 18 },
    { id: 'structure', name: 'Structure', carbon: 89, percentage: 36 },
    { id: 'envelope', name: 'Envelope', carbon: 67, percentage: 27 },
    { id: 'mechanical', name: 'Mechanical', carbon: 34, percentage: 14 },
    { id: 'electrical', name: 'Electrical', carbon: 12, percentage: 5 },
  ];

  // Force display the actual data received, ALWAYS using brand colors
  const displaySystems = (systems || defaultSystems).map((system, index) => ({
    ...system,
    color: brandColors[index % brandColors.length] // Always use brand colors in sequence
  }));
  console.log('📊 displaySystems with forced brand colors:', displaySystems);
  console.log('📊 Brand colors being used:', brandColors);
  const totalCarbon = displaySystems.reduce((sum, system) => sum + system.carbon, 0);

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Chart */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="320" height="320" className="rotate-[-90deg]">
            {displaySystems.map((system, index) => {
              const radius = 140;
              const circumference = 2 * Math.PI * radius;
              
              // Calculate rotation for each segment
              const previousPercentages = displaySystems.slice(0, index).reduce((sum, s) => sum + s.percentage, 0);
              const rotation = (previousPercentages / 100) * 360;

              return (
                <circle
                  key={system.id}
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="none"
                  stroke={system.color}
                  strokeWidth={selectedSystem === system.id ? "26" : "22"}
                  strokeDasharray={`${(system.percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    transformOrigin: '160px 160px',
                    transform: `rotate(${rotation}deg)`,
                  }}
                  onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
                />
              );
            })}
          </svg>
          
          {/* Center text - dynamic based on selection */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {selectedSystem ? (
              <>
                <div className="text-3xl font-semibold text-black">
                  {displaySystems.find(s => s.id === selectedSystem)?.carbon || 0}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">tCO₂e</div>
                <div className="text-sm text-gray-600 mt-1 text-center">
                  {displaySystems.find(s => s.id === selectedSystem)?.name}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-semibold text-black">{totalCarbon}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">tCO₂e</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {displaySystems.map((system) => (
          <button
            key={system.id}
            onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
            className={`w-full flex items-center justify-between p-3 rounded-md transition-all ${
              selectedSystem === system.id ? 'bg-gray-50' : 'hover:bg-gray-25'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: system.color }}
              />
              <span className="text-sm text-gray-900">{system.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{system.carbon} tCO₂e</div>
              <div className="text-xs text-gray-500">{system.percentage}%</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}