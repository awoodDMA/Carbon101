/**
 * Quantity Takeoff Service
 * 
 * This service automatically performs quantity takeoffs on BIM models using
 * the Autodesk Model Derivative API to extract material quantities for
 * embodied carbon calculations.
 */

export interface ElementData {
  id: string;
  externalId: string;
  name: string;
  category: string;
  level: string;
  material: string;
  volume?: number;
  area?: number;
  length?: number;
  properties: Record<string, any>;
}

export interface MaterialQuantity {
  materialName: string;
  materialType: string;
  elementCategory: string;
  volume: number; // m³
  area: number; // m²
  length: number; // m
  mass?: number; // kg (if density available)
  elementCount: number;
  elements: ElementData[];
}

export interface RevitElementType {
  id: string;
  uniclassCode: string;
  uniclassTitle: string;
  nbsChorusSuffix?: string;
  typeMark?: string;
  familyName?: string;
  typeName?: string;
  category: string;
  volume: number; // m³
  area: number; // m²
  length: number; // m
  elementCount: number;
  materials: ElementTypeMaterial[];
  properties: Record<string, any>;
}

export interface ElementTypeMaterial {
  id: string;
  materialName: string;
  materialType: string;
  uniclassCode?: string;
  uniclassTitle?: string;
  nbsChorusSuffix?: string;
  volume: number; // m³
  area: number; // m²
  length: number; // m
  mass?: number; // kg
  density?: number; // kg/m³
  unitCost?: number; // Cost per unit
  elementTypeIds: string[]; // IDs of element types that use this material
  properties: Record<string, any>;
}

export interface QuantityTakeoffResult {
  modelUrn: string;
  projectId: string;
  versionId: string;
  timestamp: string;
  totalElements: number;
  materials: MaterialQuantity[];
  elementTypes: RevitElementType[];
  materialsSummary: ElementTypeMaterial[];
  summary: {
    totalVolume: number;
    totalArea: number;
    totalLength: number;
    uniqueMaterials: number;
    uniqueElementTypes: number;
    elementCategories: string[];
  };
}

export class QuantityTakeoffService {
  private baseUrl = 'https://developer.api.autodesk.com';
  
  constructor(private accessToken: string) {}

  /**
   * Main method to perform complete quantity takeoff
   */
  async performQuantityTakeoff(
    modelUrn: string, 
    projectId: string, 
    versionId?: string
  ): Promise<QuantityTakeoffResult> {
    console.log('🔍 Starting quantity takeoff for model:', modelUrn);
    
    try {
      // 1. Get model metadata
      const metadata = await this.getModelMetadata(modelUrn);
      console.log('📊 Model metadata retrieved:', metadata.data.metadata.length, 'viewables');
      
      // 2. Extract all elements with properties
      const elements = await this.extractAllElements(modelUrn);
      console.log('🔨 Elements extracted:', elements.length);
      
      // 3. Categorize elements and extract materials
      const materialQuantities = await this.categorizeAndQuantifyMaterials(elements);
      console.log('📏 Material quantities calculated:', materialQuantities.length, 'materials');
      
      // 4. Generate element types and materials summary
      const { elementTypes, materialsSummary } = await this.generateElementTypesAndMaterials(elements, materialQuantities);
      
      // 5. Build final result
      const result: QuantityTakeoffResult = {
        modelUrn,
        projectId,
        versionId: versionId || 'latest',
        timestamp: new Date().toISOString(),
        totalElements: elements.length,
        materials: materialQuantities,
        elementTypes: elementTypes,
        materialsSummary: materialsSummary,
        summary: this.generateSummary(materialQuantities, elementTypes)
      };
      
      console.log('✅ Quantity takeoff completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Quantity takeoff failed:', error);
      throw new Error(`Quantity takeoff failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get model metadata and viewables
   */
  private async getModelMetadata(urn: string) {
    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    
    const response = await fetch(
      `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Model metadata API error:', response.status, errorText);
      throw new Error(`Failed to get model metadata: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Extract all elements from the model using Model Derivative API
   */
  private async extractAllElements(urn: string): Promise<ElementData[]> {
    console.log('🔍 Extracting elements from model...');
    
    // Get model viewables first
    const metadata = await this.getModelMetadata(urn);
    console.log('📊 Metadata response structure:', {
      hasData: !!metadata.data,
      hasMetadata: !!metadata.data?.metadata,
      metadataLength: metadata.data?.metadata?.length || 0,
      rawResponse: JSON.stringify(metadata, null, 2)
    });
    
    if (!metadata.data || !metadata.data.metadata) {
      throw new Error('Invalid metadata response structure');
    }
    
    const viewables = metadata.data.metadata;
    
    if (!viewables || viewables.length === 0) {
      throw new Error('No viewables found in model');
    }
    
    const allElements: ElementData[] = [];
    
    // Process each viewable (usually one main 3D view)
    for (const viewable of viewables) {
      if (viewable.role === '3d' || viewable.role === undefined) {
        console.log(`📋 Processing viewable: ${viewable.name || viewable.guid}`);
        
        // Get object tree
        const objectTree = await this.getObjectTree(urn, viewable.guid);
        console.log('🌳 Object tree structure check:', {
          hasData: !!objectTree.data,
          hasObjects: !!objectTree.data?.objects,
          objectsLength: objectTree.data?.objects?.length || 0
        });
        
        // Validate object tree structure
        if (!objectTree.data || !objectTree.data.objects || objectTree.data.objects.length === 0) {
          console.warn('⚠️ No objects found in object tree for viewable:', viewable.guid);
          continue;
        }
        
        // Extract object IDs from the tree first
        const objectIds = this.extractObjectIds(objectTree.data.objects[0]);
        console.log(`🔍 Found ${objectIds.length} object IDs in model`);
        
        if (objectIds.length === 0) {
          console.warn('⚠️ No object IDs found in object tree');
          continue;
        }
        
        // Get properties for these specific object IDs
        const properties = await this.getPropertiesForObjects(urn, viewable.guid, objectIds);
        console.log('📄 Properties response structure:', {
          hasData: !!properties.data,
          hasCollection: !!properties.data?.collection,
          collectionLength: properties.data?.collection?.length || 0
        });
        
        // Validate properties structure
        if (!properties.data || !properties.data.collection) {
          console.warn('⚠️ No properties collection found for viewable:', viewable.guid);
          continue;
        }
        
        // Extract elements from object tree with properties
        const viewableElements = this.processObjectTree(
          objectTree.data.objects[0], 
          properties.data.collection
        );
        
        allElements.push(...viewableElements);
      }
    }
    
    console.log(`📊 Total elements extracted: ${allElements.length}`);
    return allElements;
  }

  /**
   * Get object tree structure
   */
  private async getObjectTree(urn: string, guid: string) {
    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    
    const response = await fetch(
      `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata/${guid}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Object tree API error:', response.status, errorText);
      throw new Error(`Failed to get object tree: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Extract all object IDs from the object tree
   */
  private extractObjectIds(node: any): number[] {
    const objectIds: number[] = [];
    
    const traverse = (currentNode: any) => {
      if (currentNode.objectid !== undefined) {
        objectIds.push(currentNode.objectid);
      }
      
      if (currentNode.objects && currentNode.objects.length > 0) {
        currentNode.objects.forEach((child: any) => traverse(child));
      }
    };
    
    traverse(node);
    return objectIds;
  }

  /**
   * Get properties for specific object IDs in batches
   */
  private async getPropertiesForObjects(urn: string, guid: string, objectIds: number[]) {
    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    
    const allProperties: any[] = [];
    const batchSize = 100; // Process object IDs in batches
    
    console.log(`📄 Starting properties fetch for ${objectIds.length} objects in batches of ${batchSize}`);
    
    for (let i = 0; i < objectIds.length; i += batchSize) {
      const batch = objectIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(objectIds.length / batchSize);
      
      console.log(`📄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} objects)`);
      
      try {
        // Create URL with objectid parameters
        const objectIdParams = batch.map(id => `objectid=${id}`).join('&');
        const url = `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata/${guid}/properties?${objectIdParams}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Properties API error for batch ${batchNumber}:`, {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            batchSize: batch.length
          });
          
          // If this batch fails, try smaller batches
          if (response.status === 413 && batch.length > 10) {
            console.log(`⚠️ Batch too large, splitting batch ${batchNumber} into smaller pieces...`);
            const smallerBatches = this.splitArray(batch, 10);
            
            for (const smallBatch of smallerBatches) {
              try {
                const smallBatchProperties = await this.getPropertiesForObjectBatch(urn, guid, smallBatch);
                if (smallBatchProperties.data?.collection) {
                  allProperties.push(...smallBatchProperties.data.collection);
                }
              } catch (error) {
                console.warn(`⚠️ Small batch failed, skipping ${smallBatch.length} objects:`, error);
              }
            }
            continue;
          }
          
          // Skip this batch but continue with others
          console.warn(`⚠️ Skipping batch ${batchNumber} due to error`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.data && data.data.collection) {
          allProperties.push(...data.data.collection);
          console.log(`📄 Retrieved ${data.data.collection.length} properties from batch ${batchNumber}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing batch ${batchNumber}:`, error);
        // Continue with next batch
      }
    }
    
    console.log(`📄 Total properties retrieved: ${allProperties.length}`);
    
    return {
      data: {
        collection: allProperties
      }
    };
  }

  /**
   * Helper method to split array into smaller chunks
   */
  private splitArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get properties for a small batch of object IDs
   */
  private async getPropertiesForObjectBatch(urn: string, guid: string, objectIds: number[]) {
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    const objectIdParams = objectIds.map(id => `objectid=${id}`).join('&');
    const url = `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata/${guid}/properties?${objectIdParams}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get properties for batch: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get all properties for elements in bulk with pagination support
   * @deprecated - Use getPropertiesForObjects instead
   */
  private async getAllProperties(urn: string, guid: string) {
    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    
    const allProperties: any[] = [];
    let offset = 0;
    const limit = 1000; // Process in chunks of 1000 elements
    let hasMore = true;
    
    console.log('📄 Starting paginated properties fetch...');
    
    while (hasMore) {
      try {
        const url = `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata/${guid}/properties?forceget=true&offset=${offset}&limit=${limit}`;
        console.log(`📄 Fetching properties chunk: offset=${offset}, limit=${limit}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Properties API error:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            errorBody: errorText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          // If we get payload too large even with pagination, try smaller chunks
          if (response.status === 413 && limit > 100) {
            console.log('⚠️ Payload still too large, trying smaller chunks...');
            return this.getAllPropertiesSmallChunks(urn, guid);
          }
          
          // If we get a 400 Bad Request, it might be a model translation issue
          if (response.status === 400) {
            console.error('❌ Bad Request - this might indicate:');
            console.error('   - Model is not properly translated');
            console.error('   - Invalid viewable GUID');
            console.error('   - Model processing still in progress');
            
            // This method is deprecated, should use getPropertiesForObjects instead
            console.log('⚠️ Bad Request in deprecated getAllProperties method - should use object ID approach');
          }
          
          throw new Error(`Failed to get properties: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.collection) {
          allProperties.push(...data.data.collection);
          console.log(`📄 Retrieved ${data.data.collection.length} properties in this chunk`);
          
          // Check if we have more data
          if (data.data.collection.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
        
      } catch (error) {
        console.error('❌ Error fetching properties chunk:', error);
        throw error;
      }
    }
    
    console.log(`📄 Total properties retrieved: ${allProperties.length}`);
    
    return {
      data: {
        collection: allProperties
      }
    };
  }

  /**
   * Fallback method for very large models - uses smaller chunks
   */
  private async getAllPropertiesSmallChunks(urn: string, guid: string) {
    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    
    const allProperties: any[] = [];
    let offset = 0;
    const limit = 100; // Very small chunks
    let hasMore = true;
    
    console.log('📄 Starting small-chunk properties fetch...');
    
    while (hasMore && offset < 10000) { // Safety limit to prevent infinite loops
      try {
        const url = `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/metadata/${guid}/properties?forceget=true&offset=${offset}&limit=${limit}`;
        console.log(`📄 Fetching small properties chunk: offset=${offset}, limit=${limit}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Small chunk properties API error:', response.status, errorText);
          
          // If even small chunks fail, we'll have to work with what we have
          if (response.status === 413) {
            console.warn('⚠️ Even small chunks are too large, proceeding with available data');
            break;
          }
          
          throw new Error(`Failed to get properties: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.collection) {
          allProperties.push(...data.data.collection);
          console.log(`📄 Retrieved ${data.data.collection.length} properties in small chunk`);
          
          // Check if we have more data
          if (data.data.collection.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
        
      } catch (error) {
        console.error('❌ Error fetching small properties chunk:', error);
        // Continue with what we have rather than failing completely
        break;
      }
    }
    
    console.log(`📄 Total properties retrieved with small chunks: ${allProperties.length}`);
    
    return {
      data: {
        collection: allProperties
      }
    };
  }

  /**
   * Process object tree and extract meaningful elements
   */
  private processObjectTree(node: any, propertiesCollection: any[]): ElementData[] {
    const elements: ElementData[] = [];
    let totalNodesProcessed = 0;
    let leafNodesFound = 0;
    let physicalElementsFound = 0;
    let validElementsExtracted = 0;
    
    console.log('📊 Starting element extraction with detailed logging...');
    
    // Create property lookup for performance
    const propertyLookup = new Map();
    propertiesCollection.forEach(item => {
      propertyLookup.set(item.objectid, item.properties);
    });
    
    const processNode = (currentNode: any) => {
      totalNodesProcessed++;
      
      // Also process nodes that have objectid directly (not just leaf nodes)
      if (currentNode.objectid) {
        const properties = propertyLookup.get(currentNode.objectid) || {};
        
        // Check if this node itself represents an element
        if (currentNode.objectid && currentNode.name) {
          leafNodesFound++;
          
          // Debug: Log some examples of what we're processing
          if (leafNodesFound <= 10) {
            console.log(`🔍 Processing node ${leafNodesFound}:`, {
              objectid: currentNode.objectid,
              name: currentNode.name,
              category: this.getPropertyValue(properties, 'Category'),
              hasProperties: Object.keys(properties).length > 0,
              hasChildren: !!(currentNode.objects && currentNode.objects.length > 0),
              propertiesKeys: Object.keys(properties).slice(0, 5) // Show first few property keys
            });
          }
          
          // Check if this is a physical element
          const isPhysical = this.isPhysicalElement(currentNode, properties);
          if (isPhysical) {
            physicalElementsFound++;
            const elementData = this.extractElementData(currentNode, properties);
            if (elementData) {
              validElementsExtracted++;
              elements.push(elementData);
              
              // Log first few extracted elements for debugging
              if (validElementsExtracted <= 5) {
                console.log(`✅ Extracted element ${validElementsExtracted}:`, {
                  name: elementData.name,
                  category: elementData.category,
                  material: elementData.material,
                  volume: elementData.volume,
                  area: elementData.area,
                  hasChildren: !!(currentNode.objects && currentNode.objects.length > 0)
                });
              }
            }
          } else if (leafNodesFound <= 10) {
            console.log(`📋 Excluded documentation element:`, {
              name: currentNode.name,
              category: this.getPropertyValue(properties, 'Category')
            });
          }
        }
      }
      
      // Process children recursively
      if (currentNode.objects && currentNode.objects.length > 0) {
        currentNode.objects.forEach((child: any) => processNode(child));
      }
    };
    
    processNode(node);
    
    console.log('📊 Element extraction summary:', {
      totalNodesProcessed,
      leafNodesFound,
      physicalElementsFound,
      validElementsExtracted,
      finalElementCount: elements.length,
      filterRate: `${((leafNodesFound - physicalElementsFound) / leafNodesFound * 100).toFixed(1)}% filtered out`
    });
    
    return elements;
  }

  /**
   * Determine if an element should be included in quantity takeoff
   * Now very inclusive - only exclude obvious documentation/annotation elements
   */
  private isPhysicalElement(node: any, properties: any): boolean {
    const name = node.name || '';
    const category = this.getPropertyValue(properties, 'Category') || '';
    
    // Only exclude obvious documentation and annotation elements
    const excludeCategories = [
      'Views', 'Sheets', 'Schedules', 'Annotations', 'Dimensions', 'Tags', 
      'Text Notes', 'Detail Items', 'Revision Clouds', 'Matchlines', 
      'Scope Boxes', 'Reference Planes', 'Grids', 'Levels', 'Sections', 
      'Elevations', 'Detail Views', 'Cameras', 'RenderRegions'
    ];
    
    const excludeNames = [
      'view', 'sheet', 'schedule', 'annotation', 'dimension', 'tag', 
      'grid', 'level', 'section', 'elevation', 'camera', 'render'
    ];
    
    // Check if category explicitly suggests documentation element
    const isDocumentationCategory = excludeCategories.some(cat => 
      category && category.toLowerCase().includes(cat.toLowerCase())
    );
    
    // Check if name explicitly suggests documentation element
    const isDocumentationName = excludeNames.some(excludeName => 
      name.toLowerCase().includes(excludeName.toLowerCase())
    );
    
    // Only exclude if it's clearly a documentation element
    if (isDocumentationCategory || isDocumentationName) {
      console.log(`📋 Excluding documentation element: "${name}" (category: "${category}")`);
      return false;
    }
    
    // Include everything else - let the user decide what they want from the full list
    return true;
  }

  /**
   * Extract structured data from element properties
   */
  private extractElementData(node: any, properties: any): ElementData | null {
    try {
      // Infer category from element name if not available in properties
      let category = this.getPropertyValue(properties, 'Category');
      if (!category || category === 'null') {
        category = this.inferCategoryFromName(node.name || '');
      }
      
      const elementData: ElementData = {
        id: node.objectid.toString(),
        externalId: this.getPropertyValue(properties, 'External ID') || node.objectid.toString(),
        name: node.name || 'Unnamed Element',
        category: category || 'Unknown',
        level: this.getPropertyValue(properties, 'Level') || this.getPropertyValue(properties, 'Reference Level') || 'Unknown',
        material: this.extractMaterialName(properties),
        volume: this.extractVolume(properties),
        area: this.extractArea(properties),
        length: this.extractLength(properties),
        properties: this.extractRelevantProperties(properties)
      };
      
      return elementData;
    } catch (error) {
      console.warn('⚠️ Failed to extract element data:', error);
      return null;
    }
  }
  
  /**
   * Infer element category from its name when properties don't provide it
   */
  private inferCategoryFromName(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('wall')) return 'Walls';
    if (nameLower.includes('floor') || nameLower.includes('slab')) return 'Floors';
    if (nameLower.includes('roof')) return 'Roofs';
    if (nameLower.includes('ceiling')) return 'Ceilings';
    if (nameLower.includes('column')) return 'Structural Columns';
    if (nameLower.includes('beam')) return 'Structural Framing';
    if (nameLower.includes('foundation') || nameLower.includes('footing')) return 'Structural Foundations';
    if (nameLower.includes('door')) return 'Doors';
    if (nameLower.includes('window')) return 'Windows';
    if (nameLower.includes('stair')) return 'Stairs';
    if (nameLower.includes('railing')) return 'Railings';
    if (nameLower.includes('partition')) return 'Walls';
    if (nameLower.includes('panel')) return 'Curtain Panels';
    if (nameLower.includes('mullion')) return 'Mullions';
    
    return 'Generic Models';
  }

  /**
   * Get property value from properties object
   */
  private getPropertyValue(properties: any, propertyName: string): string | null {
    if (!properties || typeof properties !== 'object') return null;
    
    // Look through all property groups
    for (const group of Object.values(properties)) {
      if (typeof group === 'object' && group !== null) {
        for (const [key, value] of Object.entries(group)) {
          if (key.toLowerCase().includes(propertyName.toLowerCase())) {
            return typeof value === 'string' ? value : String(value);
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract material name from various property sources
   */
  private extractMaterialName(properties: any): string {
    // Try various material property names
    const materialProperties = [
      'Material', 'Material Name', 'Structural Material', 'Material: By Category',
      'Type Material', 'Material: Structural', 'Material: Thermal'
    ];
    
    for (const propName of materialProperties) {
      const material = this.getPropertyValue(properties, propName);
      if (material && material !== 'By Category' && material !== '<By Category>') {
        return material;
      }
    }
    
    // Fallback to category-based material assumption
    const category = this.getPropertyValue(properties, 'Category') || '';
    return this.inferMaterialFromCategory(category);
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
   * Extract volume from properties (m³)
   */
  private extractVolume(properties: any): number {
    const volumeProps = ['Volume', 'Gross Volume', 'Net Volume', 'Material Volume'];
    
    for (const propName of volumeProps) {
      const volume = this.getPropertyValue(properties, propName);
      if (volume) {
        const numericValue = this.parseNumericValue(volume);
        if (numericValue > 0) {
          return numericValue;
        }
      }
    }
    
    return 0;
  }

  /**
   * Extract area from properties (m²)
   */
  private extractArea(properties: any): number {
    const areaProps = ['Area', 'Gross Area', 'Net Area', 'Surface Area', 'Material Area'];
    
    for (const propName of areaProps) {
      const area = this.getPropertyValue(properties, propName);
      if (area) {
        const numericValue = this.parseNumericValue(area);
        if (numericValue > 0) {
          return numericValue;
        }
      }
    }
    
    return 0;
  }

  /**
   * Extract length from properties (m)
   */
  private extractLength(properties: any): number {
    const lengthProps = ['Length', 'Gross Length', 'Net Length'];
    
    for (const propName of lengthProps) {
      const length = this.getPropertyValue(properties, propName);
      if (length) {
        const numericValue = this.parseNumericValue(length);
        if (numericValue > 0) {
          return numericValue;
        }
      }
    }
    
    return 0;
  }

  /**
   * Parse numeric value from string (handles units)
   */
  private parseNumericValue(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    
    // Remove units and parse number
    const numStr = value.replace(/[^\d.-]/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Extract relevant properties for embodied carbon calculations
   */
  private extractRelevantProperties(properties: any): Record<string, any> {
    const relevantProps: Record<string, any> = {};
    
    // Properties useful for embodied carbon calculations
    const importantProperties = [
      'Type Name', 'Family', 'Family and Type', 'Structural Material',
      'Thickness', 'Width', 'Height', 'Depth', 'Density',
      'Thermal Resistance', 'Heat Transfer Coefficient', 'Fire Rating',
      'Load Bearing', 'Phase Created', 'Phase Demolished'
    ];
    
    for (const propName of importantProperties) {
      const value = this.getPropertyValue(properties, propName);
      if (value) {
        relevantProps[propName] = value;
      }
    }
    
    return relevantProps;
  }

  /**
   * Categorize elements and calculate material quantities
   */
  private async categorizeAndQuantifyMaterials(elements: ElementData[]): Promise<MaterialQuantity[]> {
    console.log('📊 Categorizing and quantifying materials...');
    
    // Group elements by material and category
    const materialGroups = new Map<string, Map<string, ElementData[]>>();
    
    elements.forEach(element => {
      const materialKey = element.material || 'Unknown Material';
      const categoryKey = element.category || 'Unknown Category';
      
      if (!materialGroups.has(materialKey)) {
        materialGroups.set(materialKey, new Map());
      }
      
      const categoryMap = materialGroups.get(materialKey)!;
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, []);
      }
      
      categoryMap.get(categoryKey)!.push(element);
    });
    
    // Calculate quantities for each material-category combination
    const materialQuantities: MaterialQuantity[] = [];
    
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
   * Calculate quantities for a specific material-category combination
   */
  private calculateMaterialQuantity(
    materialName: string,
    categoryName: string,
    elements: ElementData[]
  ): MaterialQuantity {
    let totalVolume = 0;
    let totalArea = 0;
    let totalLength = 0;
    
    elements.forEach(element => {
      totalVolume += element.volume || 0;
      totalArea += element.area || 0;
      totalLength += element.length || 0;
    });
    
    return {
      materialName,
      materialType: this.classifyMaterialType(materialName),
      elementCategory: categoryName,
      volume: totalVolume,
      area: totalArea,
      length: totalLength,
      elementCount: elements.length,
      elements: elements
    };
  }

  /**
   * Classify material into standard types for embodied carbon calculations
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
   * Generate element types and materials summary with Uniclass classification
   */
  private async generateElementTypesAndMaterials(
    elements: ElementData[], 
    materialQuantities: MaterialQuantity[]
  ): Promise<{ elementTypes: RevitElementType[], materialsSummary: ElementTypeMaterial[] }> {
    console.log('🏗️ Generating element types and materials with proper categorization...');
    
    // Group elements by Element Name (primary), then Type Mark (secondary)
    const elementTypeGroups = new Map<string, ElementData[]>();
    const groupingDebug = new Map<string, { elementName: string, typeMark: string, count: number }>();
    
    console.log('🏗️ Starting element grouping analysis...');
    console.log(`📊 Total elements to group: ${elements.length}`);
    
    elements.forEach((element, index) => {
      // Primary grouping: Element Name (from name property or family name)
      const elementName = element.name || 
                         this.getPropertyValue(element.properties, 'Family') || 
                         this.getPropertyValue(element.properties, 'Family Name') ||
                         element.category;
      
      // Secondary grouping: Type Mark parameter
      const typeMark = this.getPropertyValue(element.properties, 'Type Mark') || 
                      this.getPropertyValue(element.properties, 'Mark') ||
                      this.getPropertyValue(element.properties, 'Assembly Mark') ||
                      'No Mark';
      
      // Create unique key for grouping
      const typeKey = `${elementName}|${typeMark}`;
      
      // Debug logging for first few elements
      if (index < 10) {
        console.log(`🔍 Grouping element ${index + 1}:`, {
          originalName: element.name,
          category: element.category,
          extractedElementName: elementName,
          extractedTypeMark: typeMark,
          groupKey: typeKey
        });
      }
      
      if (!elementTypeGroups.has(typeKey)) {
        elementTypeGroups.set(typeKey, []);
        groupingDebug.set(typeKey, { elementName, typeMark, count: 0 });
      }
      
      elementTypeGroups.get(typeKey)!.push(element);
      groupingDebug.get(typeKey)!.count++;
    });
    
    console.log('📊 Element grouping summary:');
    console.log(`   Total unique element type groups: ${elementTypeGroups.size}`);
    console.log(`   Average elements per group: ${(elements.length / elementTypeGroups.size).toFixed(1)}`);
    
    // Show the largest groups to identify potential over-consolidation
    const sortedGroups = Array.from(groupingDebug.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
    
    console.log('🔍 Top 10 largest element groups:');
    sortedGroups.forEach(([key, info], index) => {
      console.log(`   ${index + 1}. "${info.elementName}" | "${info.typeMark}" - ${info.count} elements`);
    });
    
    // Show unique element names and type marks
    const uniqueElementNames = new Set(Array.from(groupingDebug.values()).map(g => g.elementName));
    const uniqueTypeMarks = new Set(Array.from(groupingDebug.values()).map(g => g.typeMark));
    
    console.log(`📊 Unique element names found: ${uniqueElementNames.size}`);
    console.log(`📊 Unique type marks found: ${uniqueTypeMarks.size}`);
    
    if (uniqueElementNames.size < 10) {
      console.log('⚠️ Very few unique element names found. This might indicate grouping issues.');
      console.log('Element names:', Array.from(uniqueElementNames));
    }
    
    // Generate element types with Uniclass codes
    const elementTypes: RevitElementType[] = [];
    const materialUsageMap = new Map<string, ElementTypeMaterial>();
    let elementTypeId = 1;
    
    elementTypeGroups.forEach((typeElements, typeKey) => {
      const firstElement = typeElements[0];
      const [elementName, typeMark] = typeKey.split('|');
      
      // Extract actual Uniclass codes from model properties
      const uniclassCode = this.extractUniclassCodeFromModel(firstElement.properties) || 
                          this.generateUniclassCode(firstElement.category, elementName);
      
      const uniclassTitle = this.extractUniclassTitle(firstElement.properties) ||
                           this.generateUniclassTitle(firstElement.category, elementName, typeMark);
      
      const nbsChorusSuffix = this.extractNBSChorusSuffix(firstElement.properties) ||
                             this.generateNBSChorusSuffix(firstElement.category);
      
      // Calculate totals for this element type
      const totalVolume = typeElements.reduce((sum, el) => sum + (el.volume || 0), 0);
      const totalArea = typeElements.reduce((sum, el) => sum + (el.area || 0), 0);
      const totalLength = typeElements.reduce((sum, el) => sum + (el.length || 0), 0);
      
      // Extract materials for this element type
      const elementTypeMaterials: ElementTypeMaterial[] = [];
      const materialNames = new Set(typeElements.map(el => el.material).filter(Boolean));
      
      materialNames.forEach(materialName => {
        const materialElements = typeElements.filter(el => el.material === materialName);
        const materialVolume = materialElements.reduce((sum, el) => sum + (el.volume || 0), 0);
        const materialArea = materialElements.reduce((sum, el) => sum + (el.area || 0), 0);
        const materialLength = materialElements.reduce((sum, el) => sum + (el.length || 0), 0);
        
        const materialType = this.classifyMaterialType(materialName);
        const materialUniclassCode = this.generateMaterialUniclassCode(materialType);
        const materialUniclassTitle = this.generateMaterialUniclassTitle(materialName);
        const materialNBSChorusSuffix = this.generateMaterialNBSChorusSuffix(materialType);
        
        const materialId = `mat_${materialName.replace(/[^a-zA-Z0-9]/g, '_')}_${materialType}`;
        const elementTypeIdStr = `et_${elementTypeId}`;
        
        const material: ElementTypeMaterial = {
          id: materialId,
          materialName: materialName,
          materialType: materialType,
          uniclassCode: materialUniclassCode,
          uniclassTitle: materialUniclassTitle,
          nbsChorusSuffix: materialNBSChorusSuffix,
          volume: materialVolume,
          area: materialArea,
          length: materialLength,
          elementTypeIds: [elementTypeIdStr],
          properties: {}
        };
        
        elementTypeMaterials.push(material);
        
        // Track material usage across element types
        if (materialUsageMap.has(materialId)) {
          const existingMaterial = materialUsageMap.get(materialId)!;
          existingMaterial.volume += materialVolume;
          existingMaterial.area += materialArea;
          existingMaterial.length += materialLength;
          existingMaterial.elementTypeIds.push(elementTypeIdStr);
        } else {
          materialUsageMap.set(materialId, { ...material });
        }
      });
      
      const elementType: RevitElementType = {
        id: `et_${elementTypeId}`,
        uniclassCode: uniclassCode,
        uniclassTitle: uniclassTitle,
        nbsChorusSuffix: nbsChorusSuffix,
        typeMark: typeMark !== 'No Mark' ? typeMark : undefined,
        familyName: elementName,
        typeName: this.getPropertyValue(firstElement.properties, 'Type Name') || typeMark,
        category: firstElement.category,
        volume: totalVolume,
        area: totalArea,
        length: totalLength,
        elementCount: typeElements.length,
        materials: elementTypeMaterials,
        properties: firstElement.properties
      };
      
      elementTypes.push(elementType);
      elementTypeId++;
    });
    
    // Convert material usage map to array
    const materialsSummary = Array.from(materialUsageMap.values());
    
    console.log(`🏗️ Generated ${elementTypes.length} element types and ${materialsSummary.length} unique materials`);
    
    return { elementTypes, materialsSummary };
  }
  
  /**
   * Extract Uniclass code from model properties
   */
  private extractUniclassCodeFromModel(properties: any): string | null {
    // Common property names for Uniclass codes in Revit/BIM models
    const uniclassPropertyNames = [
      'Uniclass Code',
      'UniClass Code',
      'UniClass',
      'Uniclass 2015',
      'Uniclass2015',
      'Classification Code',
      'Classification',
      'Element Classification',
      'Assembly Code',
      'Type Classification'
    ];
    
    for (const propName of uniclassPropertyNames) {
      const value = this.getPropertyValue(properties, propName);
      if (value && value.length > 0 && value !== 'None' && value !== 'N/A') {
        // Clean up the code format
        return value.trim().replace(/\s+/g, '_');
      }
    }
    
    return null;
  }
  
  /**
   * Extract Uniclass title from model properties
   */
  private extractUniclassTitle(properties: any): string | null {
    const uniclassTitleNames = [
      'Uniclass Title',
      'UniClass Title',
      'UniClass Description',
      'Classification Title',
      'Classification Description',
      'Element Description',
      'Assembly Description'
    ];
    
    for (const propName of uniclassTitleNames) {
      const value = this.getPropertyValue(properties, propName);
      if (value && value.length > 0 && value !== 'None' && value !== 'N/A') {
        return value.trim();
      }
    }
    
    return null;
  }
  
  /**
   * Extract NBS Chorus suffix from model properties
   */
  private extractNBSChorusSuffix(properties: any): string | null {
    const nbsPropertyNames = [
      'NBS Chorus',
      'NBS Code',
      'NBS Reference',
      'NBS Suffix',
      'Chorus Code',
      'Work Section',
      'Specification Reference'
    ];
    
    for (const propName of nbsPropertyNames) {
      const value = this.getPropertyValue(properties, propName);
      if (value && value.length > 0 && value !== 'None' && value !== 'N/A') {
        return value.trim().toUpperCase();
      }
    }
    
    return null;
  }

  /**
   * Generate Uniclass code based on element category and family (fallback)
   */
  private generateUniclassCode(category: string, familyName: string): string {
    const categoryLower = category.toLowerCase();
    
    // Basic Uniclass 2015 EF (Elements/Functions) codes
    if (categoryLower.includes('wall')) return 'EF_25_10';
    if (categoryLower.includes('floor') || categoryLower.includes('slab')) return 'EF_30_10';
    if (categoryLower.includes('roof')) return 'EF_35_10';
    if (categoryLower.includes('column')) return 'EF_25_30';
    if (categoryLower.includes('beam')) return 'EF_25_40';
    if (categoryLower.includes('foundation')) return 'EF_15_10';
    if (categoryLower.includes('stair')) return 'EF_34_10';
    if (categoryLower.includes('door')) return 'EF_31_10';
    if (categoryLower.includes('window')) return 'EF_31_20';
    if (categoryLower.includes('ceiling')) return 'EF_35_20';
    
    // Fallback to generic building element
    return 'EF_00_00';
  }
  
  /**
   * Generate Uniclass title based on category, family, and type
   */
  private generateUniclassTitle(category: string, familyName: string, typeName: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('wall')) return `${familyName} - ${typeName}`;
    if (categoryLower.includes('floor')) return `Floor ${familyName} - ${typeName}`;
    if (categoryLower.includes('roof')) return `Roof ${familyName} - ${typeName}`;
    if (categoryLower.includes('column')) return `Column ${familyName} - ${typeName}`;
    if (categoryLower.includes('beam')) return `Beam ${familyName} - ${typeName}`;
    if (categoryLower.includes('foundation')) return `Foundation ${familyName} - ${typeName}`;
    if (categoryLower.includes('stair')) return `Stair ${familyName} - ${typeName}`;
    if (categoryLower.includes('door')) return `Door ${familyName} - ${typeName}`;
    if (categoryLower.includes('window')) return `Window ${familyName} - ${typeName}`;
    if (categoryLower.includes('ceiling')) return `Ceiling ${familyName} - ${typeName}`;
    
    return `${category} ${familyName} - ${typeName}`;
  }
  
  /**
   * Generate NBS Chorus suffix based on element category
   */
  private generateNBSChorusSuffix(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('wall')) return 'WL';
    if (categoryLower.includes('floor')) return 'FL';
    if (categoryLower.includes('roof')) return 'RF';
    if (categoryLower.includes('column')) return 'CL';
    if (categoryLower.includes('beam')) return 'BM';
    if (categoryLower.includes('foundation')) return 'FN';
    if (categoryLower.includes('stair')) return 'ST';
    if (categoryLower.includes('door')) return 'DR';
    if (categoryLower.includes('window')) return 'WD';
    if (categoryLower.includes('ceiling')) return 'CG';
    
    return 'GN'; // Generic
  }
  
  /**
   * Generate Uniclass code for materials
   */
  private generateMaterialUniclassCode(materialType: string): string {
    const materialLower = materialType.toLowerCase();
    
    // Basic Uniclass 2015 Pr (Products) codes for materials
    if (materialLower.includes('concrete')) return 'Pr_20_58_63';
    if (materialLower.includes('steel')) return 'Pr_20_58_75';
    if (materialLower.includes('timber')) return 'Pr_25_52_36';
    if (materialLower.includes('masonry')) return 'Pr_20_58_52';
    if (materialLower.includes('glass')) return 'Pr_25_80_37';
    if (materialLower.includes('aluminum')) return 'Pr_20_58_30';
    if (materialLower.includes('insulation')) return 'Pr_25_70_45';
    if (materialLower.includes('gypsum')) return 'Pr_25_71_43';
    
    return 'Pr_00_00_00'; // Generic material
  }
  
  /**
   * Generate Uniclass title for materials
   */
  private generateMaterialUniclassTitle(materialName: string): string {
    return `${materialName} Material`;
  }
  
  /**
   * Generate NBS Chorus suffix for materials
   */
  private generateMaterialNBSChorusSuffix(materialType: string): string {
    const materialLower = materialType.toLowerCase();
    
    if (materialLower.includes('concrete')) return 'CN';
    if (materialLower.includes('steel')) return 'ST';
    if (materialLower.includes('timber')) return 'TM';
    if (materialLower.includes('masonry')) return 'MS';
    if (materialLower.includes('glass')) return 'GL';
    if (materialLower.includes('aluminum')) return 'AL';
    if (materialLower.includes('insulation')) return 'IN';
    if (materialLower.includes('gypsum')) return 'GP';
    
    return 'MT'; // Material
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(materialQuantities: MaterialQuantity[], elementTypes?: RevitElementType[]) {
    return {
      totalVolume: materialQuantities.reduce((sum, mat) => sum + mat.volume, 0),
      totalArea: materialQuantities.reduce((sum, mat) => sum + mat.area, 0),
      totalLength: materialQuantities.reduce((sum, mat) => sum + mat.length, 0),
      uniqueMaterials: materialQuantities.length,
      uniqueElementTypes: elementTypes?.length || 0,
      elementCategories: [...new Set(materialQuantities.map(mat => mat.elementCategory))]
    };
  }
}

export default QuantityTakeoffService;