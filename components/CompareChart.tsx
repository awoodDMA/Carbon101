'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CompareOption {
  id: string;
  name: string;
  carbon: number;
  systems: {
    foundation: number;
    structure: number;
    envelope: number;
    mechanical: number;
    electrical: number;
  };
}

interface CompareChartProps {
  options: CompareOption[];
  className?: string;
}

const systemColors = {
  foundation: '#3B82F6',
  structure: '#10B981',
  envelope: '#F59E0B',
  mechanical: '#EF4444',
  electrical: '#8B5CF6',
};

const systemLabels = {
  foundation: 'Foundation',
  structure: 'Structure',
  envelope: 'Envelope',
  mechanical: 'Mechanical',
  electrical: 'Electrical',
};

export default function CompareChart({ options, className }: CompareChartProps) {
  const [viewMode, setViewMode] = useState<'systems' | 'materials'>('systems');
  
  const maxCarbon = Math.max(...options.map(opt => opt.carbon));

  return (
    <div className={cn('bg-card rounded-lg border p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Carbon Comparison</h3>
        
        <div className="flex space-x-1">
          <button
            onClick={() => setViewMode('systems')}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              viewMode === 'systems'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            By Systems
          </button>
          <button
            onClick={() => setViewMode('materials')}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              viewMode === 'materials'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            By Materials
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-6">
        {options.map((option) => (
          <div key={option.id} className="space-y-2">
            {/* Option Header */}
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">
                Option {option.id} - {option.name}
              </div>
              <div className="text-sm font-medium carbon-value">
                {option.carbon.toLocaleString()} tCO₂e
              </div>
            </div>
            
            {/* Stacked Bar */}
            <div className="relative h-8 bg-muted rounded-md overflow-hidden">
              {Object.entries(option.systems).map(([system, value], index) => {
                const percentage = (value / option.carbon) * 100;
                const previousPercentages = Object.entries(option.systems)
                  .slice(0, index)
                  .reduce((sum, [, val]) => sum + (val / option.carbon) * 100, 0);

                return (
                  <div
                    key={system}
                    className="absolute top-0 h-full transition-all duration-200 hover:opacity-80"
                    style={{
                      left: `${previousPercentages}%`,
                      width: `${percentage}%`,
                      backgroundColor: systemColors[system as keyof typeof systemColors],
                    }}
                    title={`${systemLabels[system as keyof typeof systemLabels]}: ${value} tCO₂e (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            
            {/* Scale reference */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxCarbon.toLocaleString()} tCO₂e</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(systemLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: systemColors[key as keyof typeof systemColors] }}
              />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}