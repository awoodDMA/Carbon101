/**
 * Embodied Carbon Calculator Service
 * 
 * This service calculates embodied carbon values based on quantity takeoff results
 * and material carbon factors from the database.
 */

import { QuantityTakeoffResult, MaterialQuantity } from './quantity-takeoff';

export interface CarbonFactor {
  id: string;
  materialType: string;
  materialName?: string;
  carbonFactor: number; // kg CO2e per unit
  unit: string; // kg, m3, m2, m, etc.
  source: string;
  region: string;
  year: number;
  description?: string;
}

export interface MaterialCarbonResult {
  materialName: string;
  materialType: string;
  elementCategory: string;
  quantity: number;
  unit: string;
  carbonFactor: number;
  totalCarbon: number; // kg CO2e
  carbonFactorSource: string;
  assumptions?: string[];
}

export interface EmbodiedCarbonResult {
  projectId: string;
  optionId: string;
  modelUrn: string;
  totalCarbon: number; // kg CO2e total
  totalCarbonTonnes: number; // tonnes CO2e total
  carbonPerArea?: number; // kg CO2e/m² (if building area available)
  calculationDate: string;
  methodology: string;
  materials: MaterialCarbonResult[];
  summary: {
    byMaterialType: { [key: string]: number };
    byElementCategory: { [key: string]: number };
    coverage: {
      totalMaterials: number;
      materialsWithFactors: number;
      coveragePercentage: number;
    };
  };
  assumptions: string[];
  dataQuality: 'high' | 'medium' | 'low';
}

export class EmbodiedCarbonCalculator {
  private carbonFactors: CarbonFactor[] = [];
  
  constructor(carbonFactors?: CarbonFactor[]) {
    if (carbonFactors) {
      this.carbonFactors = carbonFactors;
    }
  }

  /**
   * Calculate embodied carbon from quantity takeoff results
   */
  async calculateEmbodiedCarbon(
    takeoffResult: QuantityTakeoffResult,
    projectId: string,
    optionId: string,
    buildingArea?: number
  ): Promise<EmbodiedCarbonResult> {
    console.log('🧮 Starting embodied carbon calculation...');

    // Load carbon factors if not already loaded
    if (this.carbonFactors.length === 0) {
      await this.loadCarbonFactors();
    }

    const materialResults: MaterialCarbonResult[] = [];
    const assumptions: string[] = [];
    let totalCarbon = 0;
    let materialsWithFactors = 0;

    // Calculate carbon for each material
    for (const material of takeoffResult.materials) {
      const result = this.calculateMaterialCarbon(material, assumptions);
      materialResults.push(result);
      totalCarbon += result.totalCarbon;
      
      if (result.carbonFactor > 0) {
        materialsWithFactors++;
      }
    }

    // Generate summary statistics
    const summary = this.generateSummary(materialResults, takeoffResult.materials.length, materialsWithFactors);
    
    // Assess data quality
    const dataQuality = this.assessDataQuality(summary.coverage.coveragePercentage, materialResults);

    const result: EmbodiedCarbonResult = {
      projectId,
      optionId,
      modelUrn: takeoffResult.modelUrn,
      totalCarbon,
      totalCarbonTonnes: totalCarbon / 1000,
      carbonPerArea: buildingArea ? totalCarbon / buildingArea : undefined,
      calculationDate: new Date().toISOString(),
      methodology: 'Quantity-based calculation using Model Derivative API takeoffs',
      materials: materialResults,
      summary,
      assumptions: [...new Set(assumptions)], // Remove duplicates
      dataQuality
    };

    console.log('✅ Embodied carbon calculation completed:', {
      totalCarbon: result.totalCarbonTonnes.toFixed(2) + ' tonnes CO2e',
      coverage: `${summary.coverage.coveragePercentage.toFixed(1)}%`,
      dataQuality: result.dataQuality
    });

    return result;
  }

  /**
   * Calculate carbon for a single material
   */
  private calculateMaterialCarbon(
    material: MaterialQuantity,
    assumptions: string[]
  ): MaterialCarbonResult {
    // Find best matching carbon factor
    const { carbonFactor, unit, source, matchType } = this.findBestCarbonFactor(
      material.materialType,
      material.materialName
    );

    if (matchType !== 'exact') {
      assumptions.push(
        `${material.materialName}: Used ${matchType} match for carbon factor (${carbonFactor} kg CO2e/${unit})`
      );
    }

    // Determine quantity and unit for calculation
    const { quantity, calculationUnit } = this.determineQuantityAndUnit(material, unit);

    // Calculate total carbon
    const totalCarbon = quantity * carbonFactor;

    return {
      materialName: material.materialName,
      materialType: material.materialType,
      elementCategory: material.elementCategory,
      quantity,
      unit: calculationUnit,
      carbonFactor,
      totalCarbon,
      carbonFactorSource: source,
      assumptions: matchType !== 'exact' ? [`Used ${matchType} carbon factor match`] : undefined
    };
  }

  /**
   * Find the best matching carbon factor for a material
   */
  private findBestCarbonFactor(
    materialType: string,
    materialName: string
  ): {
    carbonFactor: number;
    unit: string;
    source: string;
    matchType: 'exact' | 'type' | 'fallback';
  } {
    // 1. Try exact material name match
    const exactMatch = this.carbonFactors.find(
      factor => factor.materialName?.toLowerCase() === materialName.toLowerCase()
    );
    if (exactMatch) {
      return {
        carbonFactor: exactMatch.carbonFactor,
        unit: exactMatch.unit,
        source: exactMatch.source,
        matchType: 'exact'
      };
    }

    // 2. Try material type match
    const typeMatch = this.carbonFactors.find(
      factor => factor.materialType.toLowerCase() === materialType.toLowerCase()
    );
    if (typeMatch) {
      return {
        carbonFactor: typeMatch.carbonFactor,
        unit: typeMatch.unit,
        source: typeMatch.source,
        matchType: 'type'
      };
    }

    // 3. Fallback to default factor
    const fallback = this.carbonFactors.find(
      factor => factor.materialType === 'Other'
    );
    return {
      carbonFactor: fallback?.carbonFactor || 100,
      unit: fallback?.unit || 'kg',
      source: fallback?.source || 'Default assumption',
      matchType: 'fallback'
    };
  }

  /**
   * Determine the appropriate quantity and unit for carbon calculation
   */
  private determineQuantityAndUnit(
    material: MaterialQuantity,
    carbonUnit: string
  ): { quantity: number; calculationUnit: string } {
    // Map carbon factor units to material quantities
    const unitMapping: { [key: string]: { quantity: number; unit: string } } = {
      'm3': { quantity: material.volume, unit: 'm³' },
      'm²': { quantity: material.area, unit: 'm²' },
      'm': { quantity: material.length, unit: 'm' },
      'kg': { quantity: this.estimateMass(material), unit: 'kg' }
    };

    const mapping = unitMapping[carbonUnit];
    if (mapping && mapping.quantity > 0) {
      return { quantity: mapping.quantity, calculationUnit: mapping.unit };
    }

    // Fallback to volume if available
    if (material.volume > 0) {
      return { quantity: material.volume, calculationUnit: 'm³' };
    }

    // Fallback to area if available  
    if (material.area > 0) {
      return { quantity: material.area, calculationUnit: 'm²' };
    }

    // Last resort: use element count
    return { quantity: material.elementCount, calculationUnit: 'elements' };
  }

  /**
   * Estimate mass from volume using typical material densities
   */
  private estimateMass(material: MaterialQuantity): number {
    if (material.volume <= 0) return 0;

    // Typical material densities (kg/m³)
    const densities: { [key: string]: number } = {
      'Concrete': 2400,
      'Steel': 7850,
      'Timber': 600,
      'Masonry': 1800,
      'Glass': 2500,
      'Aluminum': 2700,
      'Insulation': 100,
      'Gypsum': 800,
      'Ceramic': 2000,
      'Other': 1000
    };

    const density = densities[material.materialType] || densities['Other'];
    return material.volume * density;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    materialResults: MaterialCarbonResult[],
    totalMaterials: number,
    materialsWithFactors: number
  ) {
    const byMaterialType: { [key: string]: number } = {};
    const byElementCategory: { [key: string]: number } = {};

    materialResults.forEach(result => {
      // Sum by material type
      byMaterialType[result.materialType] = 
        (byMaterialType[result.materialType] || 0) + result.totalCarbon;

      // Sum by element category
      byElementCategory[result.elementCategory] = 
        (byElementCategory[result.elementCategory] || 0) + result.totalCarbon;
    });

    return {
      byMaterialType,
      byElementCategory,
      coverage: {
        totalMaterials,
        materialsWithFactors,
        coveragePercentage: (materialsWithFactors / totalMaterials) * 100
      }
    };
  }

  /**
   * Assess the quality of the carbon calculation
   */
  private assessDataQuality(coveragePercentage: number, materialResults: MaterialCarbonResult[]): 'high' | 'medium' | 'low' {
    const exactMatches = materialResults.filter(r => !r.assumptions?.length).length;
    const exactMatchPercentage = (exactMatches / materialResults.length) * 100;

    if (coveragePercentage >= 90 && exactMatchPercentage >= 70) {
      return 'high';
    } else if (coveragePercentage >= 70 && exactMatchPercentage >= 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Load carbon factors from database or default values
   */
  private async loadCarbonFactors(): Promise<void> {
    try {
      // In a real implementation, this would fetch from database
      // For now, use default factors
      this.carbonFactors = [
        {
          id: '1',
          materialType: 'Concrete',
          materialName: 'Normal Weight Concrete',
          carbonFactor: 150.0,
          unit: 'm3',
          source: 'ICE Database',
          region: 'UK',
          year: 2023,
          description: 'Standard concrete mix'
        },
        {
          id: '2',
          materialType: 'Steel',
          materialName: 'Structural Steel',
          carbonFactor: 2100.0,
          unit: 'kg',
          source: 'ICE Database', 
          region: 'UK',
          year: 2023,
          description: 'Hot rolled structural steel'
        },
        {
          id: '3',
          materialType: 'Timber',
          materialName: 'Softwood Timber',
          carbonFactor: 45.0,
          unit: 'm3',
          source: 'ICE Database',
          region: 'UK',
          year: 2023,
          description: 'Kiln dried softwood'
        },
        {
          id: '4',
          materialType: 'Other',
          carbonFactor: 100.0,
          unit: 'kg',
          source: 'Default assumption',
          region: 'Global',
          year: 2023,
          description: 'Default factor for unknown materials'
        }
        // Add more factors as needed
      ];

      console.log('📚 Loaded', this.carbonFactors.length, 'carbon factors');
    } catch (error) {
      console.error('❌ Failed to load carbon factors:', error);
      // Use minimal default set
      this.carbonFactors = [
        {
          id: 'default',
          materialType: 'Other',
          carbonFactor: 100.0,
          unit: 'kg',
          source: 'Default assumption',
          region: 'Global',
          year: 2023
        }
      ];
    }
  }

  /**
   * Update carbon factors
   */
  setCarbonFactors(factors: CarbonFactor[]): void {
    this.carbonFactors = factors;
  }

  /**
   * Get current carbon factors
   */
  getCarbonFactors(): CarbonFactor[] {
    return this.carbonFactors;
  }
}

export default EmbodiedCarbonCalculator;