/**
 * Free AEC Data Model-based Quantity Takeoff Service
 * 
 * This service performs quantity takeoffs using the FREE AEC Data Model API
 * instead of the premium Model Derivative API, eliminating usage charges.
 */

import { aecDataModelService, AECElement, CarbonCalculationData } from './aec-data-model';

export interface AECQuantityTakeoffResult {
  designId: string;
  projectId: string;
  timestamp: string;
  totalElements: number;
  materials: AECMaterialQuantity[];
  elementTypes: AECElementType[];
  summary: {
    totalVolume: number;
    totalArea: number;
    uniqueMaterials: number;
    uniqueElementTypes: number;
    elementCategories: string[];
  };
}

export interface AECMaterialQuantity {
  materialName: string;
  materialType: string;
  elementCategory: string;
  volume: number; // m³
  area: number; // m²
  elementCount: number;
  carbonFactor?: number; // kg CO2e per unit
  carbonTotal?: number; // kg CO2e
  elements: AECElement[];
}

export interface AECElementType {
  id: string;
  name: string;
  category: string;
  family?: string;
  type?: string;
  volume: number;
  area: number;
  elementCount: number;
  materials: AECMaterialQuantity[];
}

export class AECQuantityTakeoffService {
  
  /**
   * Perform complete quantity takeoff using FREE AEC Data Model API
   */
  async performQuantityTakeoff(
    designId: string,
    projectId: string
  ): Promise<AECQuantityTakeoffResult> {
    console.log('🔍 Starting FREE AEC Data Model quantity takeoff for design:', designId);
    
    try {
      // 1. Get all design entities using the free AEC Data Model API
      const { elements, total } = await this.getAllDesignEntities(designId);
      console.log(`📊 Retrieved ${elements.length} elements from AEC Data Model`);
      
      // 2. Process elements into material quantities
      const materialQuantities = this.processMaterialQuantities(elements);
      console.log(`📏 Processed ${materialQuantities.length} unique materials`);
      
      // 3. Generate element types
      const elementTypes = this.generateElementTypes(elements, materialQuantities);
      console.log(`🏗️ Generated ${elementTypes.length} element types`);
      
      // 4. Calculate summary
      const summary = this.calculateSummary(materialQuantities, elementTypes);
      
      const result: AECQuantityTakeoffResult = {
        designId,
        projectId,
        timestamp: new Date().toISOString(),
        totalElements: elements.length,
        materials: materialQuantities,
        elementTypes,
        summary
      };
      
      console.log('✅ FREE AEC Data Model quantity takeoff completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ AEC quantity takeoff failed:', error);
      throw new Error(`AEC quantity takeoff failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get all design entities with pagination using FREE API
   */
  private async getAllDesignEntities(designId: string): Promise<{ elements: AECElement[]; total: number }> {
    const allElements: AECElement[] = [];
    let offset = 0;
    const batchSize = 1000; // AEC Data Model supports large batches efficiently
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📊 Fetching entities batch: offset=${offset}, limit=${batchSize}`);
      
      const result = await aecDataModelService.getDesignEntities(
        designId,
        undefined, // No filter - get all elements
        batchSize,
        offset
      );
      
      allElements.push(...result.elements);
      hasMore = result.hasMore;
      offset += batchSize;
      
      if (result.elements.length === 0) break;
    }
    
    return {
      elements: allElements,
      total: allElements.length
    };
  }
  
  /**
   * Process elements into material quantities
   */
  private processMaterialQuantities(elements: AECElement[]): AECMaterialQuantity[] {
    // Group elements by material and category
    const materialGroups = new Map<string, Map<string, AECElement[]>>();
    
    elements.forEach(element => {
      const materialName = this.extractMaterialName(element) || 'Unknown Material';
      const category = element.category || 'Unknown Category';
      
      if (!materialGroups.has(materialName)) {
        materialGroups.set(materialName, new Map());
      }
      
      const categoryMap = materialGroups.get(materialName)!;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      
      categoryMap.get(category)!.push(element);
    });
    
    // Calculate quantities for each material-category combination
    const materialQuantities: AECMaterialQuantity[] = [];
    
    materialGroups.forEach((categoryMap, materialName) => {
      categoryMap.forEach((categoryElements, categoryName) => {
        const quantity = this.calculateMaterialQuantity(
          materialName,
          categoryName,
          categoryElements
        );
        
        if (quantity.elementCount > 0) {
          materialQuantities.push(quantity);
        }
      });
    });
    
    // Sort by total volume descending
    materialQuantities.sort((a, b) => b.volume - a.volume);
    
    return materialQuantities;
  }
  
  /**
   * Extract material name from AEC element
   */
  private extractMaterialName(element: AECElement): string | null {
    // Look for material properties
    const materialProps = element.properties.filter(prop => 
      prop.name.toLowerCase().includes('material') && 
      prop.dataType === 'string' &&
      prop.value &&
      prop.value !== 'By Category' &&
      prop.value !== '<By Category>'
    );
    
    if (materialProps.length > 0) {
      return materialProps[0].value;
    }
    
    // Fallback to category-based material inference
    return this.inferMaterialFromCategory(element.category);
  }
  
  /**
   * Infer material from element category
   */
  private inferMaterialFromCategory(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('concrete') || categoryLower.includes('foundation')) {
      return 'Concrete';
    } else if (categoryLower.includes('steel') || categoryLower.includes('structural framing')) {
      return 'Steel';
    } else if (categoryLower.includes('wall')) {
      return 'Mixed Wall Materials';
    } else if (categoryLower.includes('floor') || categoryLower.includes('slab')) {
      return 'Concrete';
    } else if (categoryLower.includes('roof')) {
      return 'Mixed Roof Materials';
    } else if (categoryLower.includes('window')) {
      return 'Glass and Aluminum';
    } else if (categoryLower.includes('door')) {
      return 'Wood and Metal';
    }
    
    return 'Unknown Material';
  }
  
  /**
   * Calculate quantities for a specific material-category combination
   */
  private calculateMaterialQuantity(
    materialName: string,
    categoryName: string,
    elements: AECElement[]
  ): AECMaterialQuantity {
    let totalVolume = 0;
    let totalArea = 0;
    
    elements.forEach(element => {
      totalVolume += element.geometry?.volume || 0;
      totalArea += element.geometry?.area || 0;
    });
    
    return {
      materialName,
      materialType: this.classifyMaterialType(materialName),
      elementCategory: categoryName,
      volume: totalVolume,
      area: totalArea,
      elementCount: elements.length,
      elements: elements
    };
  }
  
  /**
   * Classify material into standard types
   */
  private classifyMaterialType(materialName: string): string {
    const material = materialName.toLowerCase();
    
    if (material.includes('concrete')) return 'Concrete';
    if (material.includes('steel') || material.includes('metal')) return 'Steel';
    if (material.includes('timber') || material.includes('wood')) return 'Timber';
    if (material.includes('brick') || material.includes('masonry')) return 'Masonry';
    if (material.includes('glass')) return 'Glass';
    if (material.includes('aluminum') || material.includes('aluminium')) return 'Aluminum';
    if (material.includes('insulation')) return 'Insulation';
    if (material.includes('gypsum') || material.includes('drywall')) return 'Gypsum';
    if (material.includes('ceramic') || material.includes('tile')) return 'Ceramic';
    if (material.includes('plastic') || material.includes('polymer')) return 'Plastic';
    
    return 'Other';
  }
  
  /**
   * Generate element types from elements
   */
  private generateElementTypes(elements: AECElement[], materialQuantities: AECMaterialQuantity[]): AECElementType[] {
    // Group elements by family/type
    const typeGroups = new Map<string, AECElement[]>();
    
    elements.forEach(element => {
      const typeKey = `${element.family || element.category}_${element.type || 'Default'}`;
      
      if (!typeGroups.has(typeKey)) {
        typeGroups.set(typeKey, []);
      }
      
      typeGroups.get(typeKey)!.push(element);
    });
    
    // Generate element types
    const elementTypes: AECElementType[] = [];
    let typeId = 1;
    
    typeGroups.forEach((typeElements, typeKey) => {
      const firstElement = typeElements[0];
      
      // Calculate totals for this element type
      const totalVolume = typeElements.reduce((sum, el) => sum + (el.geometry?.volume || 0), 0);
      const totalArea = typeElements.reduce((sum, el) => sum + (el.geometry?.area || 0), 0);
      
      // Find materials used by this element type
      const typeMaterials = materialQuantities.filter(mat => 
        mat.elements.some(el => 
          typeElements.some(te => te.id === el.id)
        )
      );
      
      const elementType: AECElementType = {
        id: `aec_et_${typeId}`,
        name: firstElement.name,
        category: firstElement.category,
        family: firstElement.family,
        type: firstElement.type,
        volume: totalVolume,
        area: totalArea,
        elementCount: typeElements.length,
        materials: typeMaterials
      };
      
      elementTypes.push(elementType);
      typeId++;
    });
    
    return elementTypes;
  }
  
  /**
   * Calculate summary statistics
   */
  private calculateSummary(materialQuantities: AECMaterialQuantity[], elementTypes: AECElementType[]) {
    return {
      totalVolume: materialQuantities.reduce((sum, mat) => sum + mat.volume, 0),
      totalArea: materialQuantities.reduce((sum, mat) => sum + mat.area, 0),
      uniqueMaterials: materialQuantities.length,
      uniqueElementTypes: elementTypes.length,
      elementCategories: [...new Set(materialQuantities.map(mat => mat.elementCategory))]
    };
  }
  
  /**
   * Calculate embodied carbon using free API
   */
  async performCarbonCalculation(
    designId: string,
    carbonDatabase: Map<string, number>
  ): Promise<CarbonCalculationData[]> {
    console.log('🌱 Starting FREE embodied carbon calculation for design:', designId);
    
    try {
      // Use the free AEC Data Model service for carbon calculation
      const carbonData = await aecDataModelService.extractCarbonData(designId, carbonDatabase);
      
      console.log(`🌱 Calculated carbon for ${carbonData.length} elements using FREE API`);
      return carbonData;
      
    } catch (error) {
      console.error('❌ Carbon calculation failed:', error);
      throw new Error(`Carbon calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const aecQuantityTakeoffService = new AECQuantityTakeoffService();