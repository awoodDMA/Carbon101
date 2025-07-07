'use client';

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import CompareChart from '@/components/CompareChart';
import FilterPanel from '@/components/FilterPanel';
import { cn } from '@/lib/utils';

const mockOptions = [
  {
    id: 'A',
    name: 'Steel Frame',
    carbon: 245,
    systems: {
      foundation: 45,
      structure: 89,
      envelope: 67,
      mechanical: 34,
      electrical: 10,
    },
  },
  {
    id: 'B',
    name: 'Concrete Frame',
    carbon: 198,
    systems: {
      foundation: 38,
      structure: 72,
      envelope: 54,
      mechanical: 26,
      electrical: 8,
    },
  },
  {
    id: 'C',
    name: 'Timber Frame',
    carbon: 156,
    systems: {
      foundation: 30,
      structure: 45,
      envelope: 48,
      mechanical: 24,
      electrical: 9,
    },
  },
];

export default function ComparePage() {
  const [selectedOptions, setSelectedOptions] = useState(['A', 'B']);
  const [showFilters, setShowFilters] = useState(false);
  const [optionsDropdownOpen, setOptionsDropdownOpen] = useState(false);

  const selectedOptionsData = mockOptions.filter(opt => 
    selectedOptions.includes(opt.id)
  );

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const clearAllOptions = () => {
    setSelectedOptions([]);
  };

  return (
    <div className="container-spacing">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-6">Compare Design Options</h1>
        
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Multi-select dropdown */}
            <div className="relative">
              <button
                onClick={() => setOptionsDropdownOpen(!optionsDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm bg-background hover:bg-accent transition-colors min-w-[200px] justify-between"
              >
                <span>
                  {selectedOptions.length > 0
                    ? `${selectedOptions.length} option${selectedOptions.length > 1 ? 's' : ''} selected`
                    : 'Select options to compare'
                  }
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {optionsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-background border border-input rounded-md shadow-lg z-10">
                  <div className="p-2">
                    {mockOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                        htmlFor={`option-${option.id}`}
                        aria-label={`Select Option ${option.id} - ${option.name}`}
                      >
                        <input
                          id={`option-${option.id}`}
                          type="checkbox"
                          checked={selectedOptions.includes(option.id)}
                          onChange={() => handleOptionToggle(option.id)}
                          className="rounded border-input"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">
                            Option {option.id} - {option.name}
                          </span>
                          <div className="text-xs text-muted-foreground carbon-value">
                            {option.carbon} tCO₂e
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {selectedOptions.length > 0 && (
                    <div className="border-t p-2">
                      <button
                        onClick={clearAllOptions}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {selectedOptions.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Comparing {selectedOptions.map(id => `Option ${id}`).join(', ')}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm transition-colors',
              showFilters ? 'bg-accent' : 'hover:bg-accent'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Main Content */}
        <div className={cn(
          'grid gap-6',
          showFilters ? 'lg:grid-cols-[1fr_300px]' : 'grid-cols-1'
        )}>
          <div className="space-y-6">
            {selectedOptionsData.length > 0 ? (
              <CompareChart options={selectedOptionsData} />
            ) : (
              <div className="bg-card rounded-lg border p-12 text-center">
                <div className="text-muted-foreground mb-2">
                  Select design options to compare
                </div>
                <div className="text-sm text-muted-foreground">
                  Choose 2 or more options from the dropdown above to see a detailed comparison
                </div>
              </div>
            )}
          </div>
          
          {showFilters && (
            <FilterPanel onClose={() => setShowFilters(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
