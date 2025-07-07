'use client';

import { useRouter } from 'next/navigation';

interface Option {
  id: string;
  name: string;
  carbon: number;
  systems?: any[];
  systemsData?: any[];
  productsData?: any[];
}

interface OptionSelectorProps {
  projectId: string;
  currentOptionId: string;
  options: Option[];
}

export default function OptionSelector({ projectId, currentOptionId, options }: OptionSelectorProps) {
  const router = useRouter();
  
  // Debug logging (can be removed once confirmed working)
  console.log('🔧 OptionSelector:', { currentOptionId, optionsCount: options.length });
  
  return (
    <select 
      className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium text-primary"
      value={currentOptionId}
      onChange={(e) => {
        router.push(`/projects/${projectId}/option-${e.target.value}`);
      }}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          Option {option.id} - {option.name} ({option.carbon} tCO₂e)
        </option>
      ))}
    </select>
  );
}