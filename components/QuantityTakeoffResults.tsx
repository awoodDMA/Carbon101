'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Download, RefreshCw, Package, BarChart3, Layers } from 'lucide-react';
import { QuantityTakeoffResult, MaterialQuantity, RevitElementType, ElementTypeMaterial } from '@/lib/quantity-takeoff';

interface QuantityTakeoffResultsProps {
  modelUrn: string;
  projectId: string;
  optionId: string;
  versionId?: string;
  onTakeoffComplete?: (result: QuantityTakeoffResult) => void;
}

export function QuantityTakeoffResults({ 
  modelUrn, 
  projectId, 
  optionId,
  versionId,
  onTakeoffComplete 
}: QuantityTakeoffResultsProps) {
  const [takeoffResult, setTakeoffResult] = useState<QuantityTakeoffResult | null>(null);
  const [expandedElementTypes, setExpandedElementTypes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check for existing takeoff on mount
  useEffect(() => {
    checkExistingTakeoff();
  }, [modelUrn, projectId, optionId, versionId]);

  const checkExistingTakeoff = async () => {
    try {
      const params = new URLSearchParams({
        modelUrn,
        projectId,
        optionId,
        ...(versionId && { versionId })
      });

      const response = await fetch(`/api/quantity-takeoff?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasExistingTakeoff && data.data) {
          setTakeoffResult(data.data);
          setLastUpdated(new Date(data.data.timestamp));
        }
      }
    } catch (err) {
      console.warn('Failed to check existing takeoff:', err);
    }
  };

  const performTakeoff = async (force = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quantity-takeoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelUrn,
          projectId,
          optionId,
          versionId,
          force
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Quantity takeoff failed');
      }

      const data = await response.json();
      setTakeoffResult(data.data);
      setLastUpdated(new Date());
      
      onTakeoffComplete?.(data.data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (!takeoffResult) return;

    // Create CSV content
    const csvContent = generateCSV(takeoffResult);
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantity-takeoff-${takeoffResult.projectId}-${optionId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (result: QuantityTakeoffResult): string => {
    const headers = [
      'Material Name',
      'Material Type', 
      'Element Category',
      'Volume (m³)',
      'Area (m²)',
      'Length (m)',
      'Element Count'
    ];

    const rows = result.materials.map(material => [
      material.materialName,
      material.materialType,
      material.elementCategory,
      material.volume.toFixed(3),
      material.area.toFixed(3),
      material.length.toFixed(3),
      material.elementCount.toString()
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getMaterialTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Concrete': 'bg-gray-100 text-gray-800 border-gray-200',
      'Steel': 'bg-blue-100 text-blue-800 border-blue-200',
      'Timber': 'bg-green-100 text-green-800 border-green-200',
      'Masonry': 'bg-red-100 text-red-800 border-red-200',
      'Glass': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Aluminum': 'bg-slate-100 text-slate-800 border-slate-200',
      'Insulation': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Other': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type] || colors['Other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quantity Takeoff</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {takeoffResult && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={() => performTakeoff(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {takeoffResult ? 'Refresh' : 'Start'} Takeoff
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-700">
            <Package className="h-5 w-5" />
            <span className="font-medium">Takeoff Failed</span>
          </div>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => performTakeoff(false)}
            disabled={isLoading}
            className="mt-3 px-4 py-2 border border-red-300 rounded-md text-sm font-medium bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="border border-gray-200 bg-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <p className="font-medium">Performing Quantity Takeoff...</p>
              <p className="text-sm text-gray-500">
                Analyzing model elements and extracting material quantities
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {takeoffResult && !isLoading && (
        <>
          {/* Element Types Table */}
          {takeoffResult.elementTypes && takeoffResult.elementTypes.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Element Types
                </h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Element Name</th>
                        <th className="text-left p-3 font-medium">Type Mark</th>
                        <th className="text-left p-3 font-medium">Uniclass Code</th>
                        <th className="text-left p-3 font-medium">NBS Chorus</th>
                        <th className="text-right p-3 font-medium">Volume (m³)</th>
                        <th className="text-right p-3 font-medium">Area (m²)</th>
                        <th className="text-right p-3 font-medium">Length (m)</th>
                        <th className="text-right p-3 font-medium">Count</th>
                        <th className="text-center p-3 font-medium">Materials</th>
                      </tr>
                    </thead>
                    <tbody>
                      {takeoffResult.elementTypes
                        .sort((a, b) => {
                          // Sort by element name first, then by type mark, then by volume descending
                          const nameComparison = (a.familyName || '').localeCompare(b.familyName || '');
                          if (nameComparison !== 0) return nameComparison;
                          
                          const typeMarkA = a.typeMark || '';
                          const typeMarkB = b.typeMark || '';
                          const typeMarkComparison = typeMarkA.localeCompare(typeMarkB);
                          if (typeMarkComparison !== 0) return typeMarkComparison;
                          
                          return b.volume - a.volume;
                        })
                        .map((elementType) => (
                          <React.Fragment key={elementType.id}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium">{elementType.familyName}</div>
                                {elementType.uniclassTitle && elementType.uniclassTitle !== elementType.familyName && (
                                  <div className="text-sm text-gray-600">{elementType.uniclassTitle}</div>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                                  elementType.typeMark ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {elementType.typeMark || 'No Mark'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-sm">{elementType.uniclassCode}</td>
                              <td className="p-3 text-sm text-gray-600">{elementType.nbsChorusSuffix || '-'}</td>
                              <td className="p-3 text-right font-mono">{formatNumber(elementType.volume)}</td>
                              <td className="p-3 text-right font-mono">{formatNumber(elementType.area)}</td>
                              <td className="p-3 text-right font-mono">{formatNumber(elementType.length)}</td>
                              <td className="p-3 text-right">{elementType.elementCount.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                {elementType.materials.length > 0 && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedElementTypes);
                                      if (newExpanded.has(elementType.id)) {
                                        newExpanded.delete(elementType.id);
                                      } else {
                                        newExpanded.add(elementType.id);
                                      }
                                      setExpandedElementTypes(newExpanded);
                                    }}
                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 text-sm font-medium"
                                  >
                                    {expandedElementTypes.has(elementType.id) ? '−' : '+'}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedElementTypes.has(elementType.id) && elementType.materials.map((material) => (
                              <tr key={`${elementType.id}-${material.id}`} className="bg-gray-50">
                                <td className="p-3 pl-8">
                                  <div className="text-sm font-medium text-gray-700">└─ {material.materialName}</div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getMaterialTypeColor(material.materialType)}`}>
                                    {material.materialType}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-gray-500">-</td>
                                <td className="p-3 font-mono text-sm text-gray-600">{material.uniclassCode || '-'}</td>
                                <td className="p-3 text-sm text-gray-600">{material.nbsChorusSuffix || '-'}</td>
                                <td className="p-3 text-right font-mono text-sm">{formatNumber(material.volume)}</td>
                                <td className="p-3 text-right font-mono text-sm">{formatNumber(material.area)}</td>
                                <td className="p-3 text-right font-mono text-sm">{formatNumber(material.length)}</td>
                                <td className="p-3 text-right text-sm">-</td>
                                <td className="p-3"></td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Materials Summary Table */}
          {takeoffResult.materialsSummary && takeoffResult.materialsSummary.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Materials Summary
                </h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Material</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Uniclass Code</th>
                        <th className="text-right p-3 font-medium">Volume (m³)</th>
                        <th className="text-right p-3 font-medium">Area (m²)</th>
                        <th className="text-right p-3 font-medium">Length (m)</th>
                        <th className="text-left p-3 font-medium">Used In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {takeoffResult.materialsSummary
                        .sort((a, b) => b.volume - a.volume)
                        .map((material) => (
                          <tr key={material.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium">{material.materialName}</div>
                              {material.uniclassTitle && (
                                <div className="text-sm text-gray-600">{material.uniclassTitle}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMaterialTypeColor(material.materialType)}`}>
                                {material.materialType}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-sm">{material.uniclassCode || '-'}</td>
                            <td className="p-3 text-right font-mono">{formatNumber(material.volume)}</td>
                            <td className="p-3 text-right font-mono">{formatNumber(material.area)}</td>
                            <td className="p-3 text-right font-mono">{formatNumber(material.length)}</td>
                            <td className="p-3 text-sm text-gray-600">
                              {material.elementTypeIds.length} element type(s)
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards - Remove boxes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Elements</p>
                  <p className="text-2xl font-bold">{takeoffResult.totalElements.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Materials</p>
                  <p className="text-2xl font-bold">{takeoffResult.summary.uniqueMaterials}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Volume</p>
                  <p className="text-2xl font-bold">{formatNumber(takeoffResult.summary.totalVolume)} m³</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Area</p>
                  <p className="text-2xl font-bold">{formatNumber(takeoffResult.summary.totalArea)} m²</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legacy Materials Table - Only show if no new structure is available */}
          {(!takeoffResult.elementTypes || takeoffResult.elementTypes.length === 0) && takeoffResult.materials && takeoffResult.materials.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Quantities (Legacy)
                </h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Material</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-right p-3 font-medium">Volume (m³)</th>
                        <th className="text-right p-3 font-medium">Area (m²)</th>
                        <th className="text-right p-3 font-medium">Elements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {takeoffResult.materials
                        .sort((a, b) => b.volume - a.volume)
                        .map((material, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium">{material.materialName}</div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMaterialTypeColor(material.materialType)}`}>
                                {material.materialType}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600">{material.elementCategory}</td>
                            <td className="p-3 text-right font-mono">
                              {formatNumber(material.volume)}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {formatNumber(material.area)}
                            </td>
                            <td className="p-3 text-right">
                              {material.elementCount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!takeoffResult && !isLoading && !error && (
        <div className="border border-gray-200 bg-white rounded-lg p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Quantity Takeoff Available
          </h3>
          <p className="text-gray-500 mb-4">
            Start a quantity takeoff to analyze material quantities in this model.
          </p>
          <button 
            onClick={() => performTakeoff(false)}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Start Quantity Takeoff
          </button>
        </div>
      )}
    </div>
  );
}

export default QuantityTakeoffResults;