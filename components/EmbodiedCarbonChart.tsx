'use client';

import { useState } from 'react';

interface System {
  id: string;
  name: string;
  carbon: number;
  color: string;
  percentage: number;
}

interface EmbodiedCarbonChartProps {
  systems?: System[];
}

export default function EmbodiedCarbonChart({ systems }: EmbodiedCarbonChartProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  
  // Debug logging to find the issue
  console.log('📊 EmbodiedCarbonChart received systems prop:', systems);
  console.log('📊 Systems is undefined/null?', systems === undefined || systems === null);
  if (systems) {
    console.log('📊 First system:', systems[0]);
  }

  const defaultSystems = [
    { id: 'foundation', name: 'Foundation', carbon: 45, color: '#3B82F6', percentage: 18 },
    { id: 'structure', name: 'Structure', carbon: 89, color: '#10B981', percentage: 36 },
    { id: 'envelope', name: 'Envelope', carbon: 67, color: '#F59E0B', percentage: 27 },
    { id: 'mechanical', name: 'Mechanical', carbon: 34, color: '#EF4444', percentage: 14 },
    { id: 'electrical', name: 'Electrical', carbon: 12, color: '#8B5CF6', percentage: 5 },
  ];

  // Force display the actual data received
  const displaySystems = systems || defaultSystems;
  console.log('📊 displaySystems after logic:', displaySystems);
  const totalCarbon = displaySystems.reduce((sum, system) => sum + system.carbon, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      {/* Chart */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="280" height="280" className="rotate-[-90deg]">
            {displaySystems.map((system, index) => {
              const radius = 120;
              const circumference = 2 * Math.PI * radius;
              
              // Calculate rotation for each segment
              const previousPercentages = displaySystems.slice(0, index).reduce((sum, s) => sum + s.percentage, 0);
              const rotation = (previousPercentages / 100) * 360;

              return (
                <circle
                  key={system.id}
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke={system.color}
                  strokeWidth={selectedSystem === system.id ? "28" : "24"}
                  strokeDasharray={`${(system.percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-200 cursor-pointer hover:opacity-80"
                  style={{
                    transformOrigin: '140px 140px',
                    transform: `rotate(${rotation}deg)`,
                  }}
                  onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900">{totalCarbon}</div>
            <div className="text-sm text-gray-600">tCO₂e</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {displaySystems.map((system) => (
          <button
            key={system.id}
            onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all hover:bg-gray-50 ${
              selectedSystem === system.id ? 'bg-gray-50 ring-2 ring-gray-200' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: system.color }}
              />
              <span className="text-sm font-medium text-gray-900">{system.name}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{system.carbon} tCO₂e</div>
              <div className="text-sm text-gray-600">{system.percentage}%</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}