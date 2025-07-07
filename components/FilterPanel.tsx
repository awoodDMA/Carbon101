'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterPanelProps {
  className?: string;
  onClose?: () => void;
}

const systemFilters: FilterOption[] = [
  { id: 'foundation', label: 'Foundation', checked: true },
  { id: 'structure', label: 'Structure', checked: true },
  { id: 'envelope', label: 'Envelope', checked: true },
  { id: 'mechanical', label: 'Mechanical', checked: true },
  { id: 'electrical', label: 'Electrical', checked: true },
];

const materialFilters: FilterOption[] = [
  { id: 'concrete', label: 'Concrete', checked: true },
  { id: 'steel', label: 'Steel', checked: true },
  { id: 'timber', label: 'Timber', checked: true },
  { id: 'glass', label: 'Glass', checked: true },
  { id: 'insulation', label: 'Insulation', checked: true },
  { id: 'aluminum', label: 'Aluminum', checked: false },
];

export default function FilterPanel({ className, onClose }: FilterPanelProps) {
  const [systems, setSystems] = useState(systemFilters);
  const [materials, setMaterials] = useState(materialFilters);
  const [systemsExpanded, setSystemsExpanded] = useState(true);
  const [materialsExpanded, setMaterialsExpanded] = useState(true);

  const handleSystemToggle = (id: string) => {
    setSystems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleMaterialToggle = (id: string) => {
    setMaterials(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleSelectAllSystems = () => {
    setSystems(prev => prev.map(item => ({ ...item, checked: true })));
  };

  const handleUnselectAllSystems = () => {
    setSystems(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const handleSelectAllMaterials = () => {
    setMaterials(prev => prev.map(item => ({ ...item, checked: true })));
  };

  const handleUnselectAllMaterials = () => {
    setMaterials(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const activeFiltersCount = [...systems, ...materials].filter(f => f.checked).length;

  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Filters</h3>
          <p className="text-xs text-muted-foreground">
            {activeFiltersCount} active filters
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Systems Section */}
      <div className="mb-6">
        <button
          onClick={() => setSystemsExpanded(!systemsExpanded)}
          className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors"
          aria-expanded={systemsExpanded}
        >
          <span className="font-medium text-sm">Systems</span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 transition-transform',
              !systemsExpanded && '-rotate-90'
            )} 
          />
        </button>
        
        {systemsExpanded && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleSelectAllSystems}
                className="text-xs text-primary hover:text-primary/80 underline"
              >
                Select All
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <button
                onClick={handleUnselectAllSystems}
                className="text-xs text-primary hover:text-primary/80 underline"
              >
                Unselect All
              </button>
            </div>
            
            {systems.map((system) => (
              <label
                key={system.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                htmlFor={`system-${system.id}`}
              >
                <input
                  id={`system-${system.id}`}
                  type="checkbox"
                  checked={system.checked}
                  onChange={() => handleSystemToggle(system.id)}
                  className="rounded border-input"
                />
                <span className="text-sm">{system.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div>
        <button
          onClick={() => setMaterialsExpanded(!materialsExpanded)}
          className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors"
          aria-expanded={materialsExpanded}
        >
          <span className="font-medium text-sm">Materials</span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 transition-transform',
              !materialsExpanded && '-rotate-90'
            )} 
          />
        </button>
        
        {materialsExpanded && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleSelectAllMaterials}
                className="text-xs text-primary hover:text-primary/80 underline"
              >
                Select All
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <button
                onClick={handleUnselectAllMaterials}
                className="text-xs text-primary hover:text-primary/80 underline"
              >
                Unselect All
              </button>
            </div>
            
            {materials.map((material) => (
              <label
                key={material.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                htmlFor={`material-${material.id}`}
              >
                <input
                  id={`material-${material.id}`}
                  type="checkbox"
                  checked={material.checked}
                  onChange={() => handleMaterialToggle(material.id)}
                  className="rounded border-input"
                />
                <span className="text-sm">{material.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}