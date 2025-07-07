'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'systems' | 'products';
type SortField = 'name' | 'quantity' | 'carbon' | 'percentage';
type SortDirection = 'asc' | 'desc';

interface SystemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  carbon: number;
  percentage: number;
}

interface ProductData {
  id: string;
  guid: string;
  name: string;
  quantity: number;
  unit: string;
  carbon: number;
  percentage: number;
}

interface DataTableProps {
  className?: string;
  systemsData?: SystemData[];
  productsData?: ProductData[];
}

const mockSystems: SystemData[] = [
  { id: '1', name: 'Foundation', quantity: 450, unit: 'm³', carbon: 45, percentage: 18 },
  { id: '2', name: 'Structure', quantity: 1200, unit: 'm³', carbon: 89, percentage: 36 },
  { id: '3', name: 'Envelope', quantity: 2400, unit: 'm²', carbon: 67, percentage: 27 },
  { id: '4', name: 'Mechanical', quantity: 85, unit: 'units', carbon: 34, percentage: 14 },
  { id: '5', name: 'Electrical', quantity: 45, unit: 'units', carbon: 12, percentage: 5 },
];

const mockProducts: ProductData[] = [
  { id: '1', guid: 'ABC123-DEF456', name: 'Concrete Foundation Slab', quantity: 450, unit: 'm³', carbon: 45, percentage: 18 },
  { id: '2', guid: 'GHI789-JKL012', name: 'Steel Beam 300x150', quantity: 24, unit: 'pcs', carbon: 12, percentage: 5 },
  { id: '3', guid: 'MNO345-PQR678', name: 'Curtain Wall System', quantity: 1200, unit: 'm²', carbon: 34, percentage: 14 },
  { id: '4', guid: 'STU901-VWX234', name: 'HVAC Unit 50kW', quantity: 4, unit: 'units', carbon: 23, percentage: 9 },
  { id: '5', guid: 'YZA567-BCD890', name: 'LED Lighting Fixture', quantity: 120, unit: 'pcs', carbon: 8, percentage: 3 },
];

export default function DataTable({ className, systemsData, productsData }: DataTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('systems');
  const [sortField, setSortField] = useState<SortField>('carbon');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Debug logging to find the issue
  console.log('📋 DataTable received props:');
  console.log('  systemsData:', systemsData);
  console.log('  productsData:', productsData);
  console.log('  systemsData is undefined/null?', systemsData === undefined || systemsData === null);
  console.log('  productsData is undefined/null?', productsData === undefined || productsData === null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortData = <T extends SystemData | ProductData>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const displaySystems = systemsData || mockSystems;
  const displayProducts = productsData || mockProducts;
  const data = activeTab === 'systems' ? sortData(displaySystems) : sortData(displayProducts);

  return (
    <div className={cn('', className)}>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('systems')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors rounded-md',
              activeTab === 'systems'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
            )}
          >
            Systems
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors rounded-md',
              activeTab === 'products'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
            )}
          >
            Products
          </button>
        </div>
        
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => {
            // Mock CSV export
            const csvContent = data.map(row => 
              Object.values(row).join(',')
            ).join('\\n');
            console.log('CSV Export:', csvContent);
          }}
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              {activeTab === 'products' && (
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    GUID
                    <SortIcon field="name" />
                  </button>
                </th>
              )}
              <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity
                  <SortIcon field="quantity" />
                </button>
              </th>
              <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('carbon')}
                >
                  Carbon (tCO₂e)
                  <SortIcon field="carbon" />
                </button>
              </th>
              <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('percentage')}
                >
                  Percentage
                  <SortIcon field="percentage" />
                </button>
              </th>
              <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row.id} 
                className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                {activeTab === 'products' && 'guid' in row && (
                  <td className="p-3 text-sm font-mono text-gray-500">
                    <span className="hidden lg:inline">{(row as ProductData).guid}</span>
                    <span className="lg:hidden">{(row as ProductData).guid.slice(0, 8)}...</span>
                  </td>
                )}
                <td className="p-3 text-sm text-gray-900">{row.name}</td>
                <td className="p-3 text-sm text-gray-600">
                  {row.quantity.toLocaleString()} {row.unit}
                </td>
                <td className="p-3 text-sm font-medium text-gray-900">{row.carbon}</td>
                <td className="p-3 text-sm text-gray-500">{row.percentage}%</td>
                <td className="p-3">
                  <button
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}