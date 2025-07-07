/**
 * AEC Data Model API Integration for Carbon101
 * Provides structured access to BIM data following Autodesk's recommended patterns
 */

import { apsService } from './autodesk-aps';

export interface AECModelSet {
  id: string;
  name: string;
  status: 'ready' | 'processing' | 'failed';
  type: 'fusion' | 'revit' | 'autocad' | 'other';
  createdTime: string;
  lastModifiedTime: string;
  sourceFileName: string;
  units: string;
  extractorVersion: string;
  parentProject: {
    id: string;
    name: string;
  };
}

export interface AECElement {
  id: string;
  name: string;
  category: string;
  family?: string;
  type?: string;
  level?: string;
  room?: string;
  properties: AECProperty[];
  geometry?: {
    boundingBox: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
    volume?: number;
    area?: number;
  };
}

export interface AECProperty {
  name: string;
  value: any;
  displayName: string;
  category: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'area' | 'volume' | 'length';
  units?: string;
}

export interface AECElementFilter {
  categories?: string[];
  families?: string[];
  levels?: string[];
  properties?: {
    name: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
}

export interface CarbonCalculationData {
  elementId: string;
  materialName: string;
  volume: number;
  area: number;
  carbonFactor: number; // kg CO2e per unit
  carbonTotal: number;
  category: string;
}

class AECDataModelService {
  private graphqlUrl = 'https://developer.api.autodesk.com/aec/v1/graphql';
  private restUrl = 'https://developer.api.autodesk.com/aec/v1';

  /**
   * Get all designs for a project using GraphQL
   * Following AEC Data Model best practices
   */
  async getProjectDesigns(projectId: string): Promise<AECModelSet[]> {
    const token = apsService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const query = `
      query GetDesigns($projectId: ID!) {
        designs(projectId: $projectId) {
          results {
            id
            name
            status
            createdAt
            lastModifiedAt
            sourceFileName
            units
          }
        }
      }
    `;

    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { projectId }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get designs: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformGraphQLDesignsResponse(data);
  }

  /**
   * Get specific model set details
   */
  async getModelSet(projectId: string, modelSetId: string): Promise<AECModelSet> {
    const token = apsService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.restUrl}/projects/${projectId}/modelsets/${modelSetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get model set: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformGraphQLDesignsResponse(data)[0] || null;
  }

  /**
   * Get design entities (elements) using GraphQL
   * Essential for carbon calculation workflows - following best practices
   */
  async getDesignEntities(
    designId: string, 
    filter?: AECElementFilter,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ elements: AECElement[]; total: number; hasMore: boolean }> {
    const token = apsService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // Build filter condition for GraphQL
    let filterCondition = '';
    if (filter?.categories && filter.categories.length > 0) {
      const categories = filter.categories.map(c => `"${c}"`).join(', ');
      filterCondition = `filter: { classification: [${categories}] }`;
    }

    const query = `
      query GetDesignEntities($designId: ID!, $limit: Int!, $offset: Int!) {
        design(id: $designId) {
          designEntities(${filterCondition}, limit: $limit, offset: $offset) {
            results {
              id
              name
              classification
              family
              type
              level
              properties {
                name
                value
                displayName
                category
                dataType
                units
              }
              quantities {
                area
                volume
                length
                count
              }
            }
            pagination {
              limit
              offset
              totalResults
            }
          }
        }
      }
    `;

    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { designId, limit, offset }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get design entities: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformGraphQLEntitiesResponse(data);
  }

  /**
   * Get element properties with detailed information for carbon calculations
   */
  async getElementProperties(
    projectId: string, 
    modelSetId: string, 
    elementId: string
  ): Promise<AECProperty[]> {
    const token = apsService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `${this.restUrl}/projects/${projectId}/modelsets/${modelSetId}/elements/${elementId}/properties`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get element properties: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformPropertiesResponse(data);
  }

  /**
   * Extract carbon calculation data from BIM elements using GraphQL
   * This follows the recommended workflow for quantity takeoff
   */
  async extractCarbonData(
    designId: string,
    carbonDatabase: Map<string, number> // material -> carbon factor mapping
  ): Promise<CarbonCalculationData[]> {
    const results: CarbonCalculationData[] = [];
    let offset = 0;
    const batchSize = 1000; // GraphQL can handle larger batches efficiently

    // Filter for structural and architectural elements
    const filter: AECElementFilter = {
      categories: [
        'Structural Columns',
        'Structural Beams', 
        'Structural Foundations',
        'Walls',
        'Floors',
        'Roofs',
        'Structural Framing',
        'Doors', // Add doors for comprehensive analysis
        'Windows'
      ]
    };

    while (true) {
      const entitiesData = await this.getDesignEntities(designId, filter, batchSize, offset);
      
      if (entitiesData.elements.length === 0) break;

      for (const element of entitiesData.elements) {
        const carbonData = this.calculateElementCarbonFromGraphQL(element, carbonDatabase);
        if (carbonData) {
          results.push(carbonData);
        }
      }

      if (!entitiesData.hasMore) break;
      offset += batchSize;
    }

    return results;
  }

  /**
   * Calculate carbon for individual element from GraphQL data
   */
  private calculateElementCarbonFromGraphQL(
    element: AECElement,
    carbonDatabase: Map<string, number>
  ): CarbonCalculationData | null {
    // Extract material information from properties
    const materialProp = element.properties.find(p => 
      p.name.toLowerCase().includes('material') && p.dataType === 'string'
    );
    
    if (!materialProp) return null;

    const materialName = materialProp.value;
    const carbonFactor = carbonDatabase.get(materialName.toLowerCase()) || 0;

    if (carbonFactor === 0) return null;

    // GraphQL provides quantities directly
    const volume = element.geometry?.volume || 0;
    const area = element.geometry?.area || 0;

    // Use volume if available, otherwise area
    const quantity = volume > 0 ? volume : area;
    const carbonTotal = quantity * carbonFactor;

    return {
      elementId: element.id,
      materialName,
      volume,
      area,
      carbonFactor,
      carbonTotal,
      category: element.category,
    };
  }

  /**
   * Transform API responses to our interfaces
   */
  private transformGraphQLDesignsResponse(data: any): AECModelSet[] {
    const designs = data.data?.designs?.results || [];
    return designs.map((design: any) => ({
      id: design.id,
      name: design.name || 'Unknown',
      status: design.status || 'ready',
      type: 'revit', // GraphQL designs are typically Revit models
      createdTime: design.createdAt || new Date().toISOString(),
      lastModifiedTime: design.lastModifiedAt || new Date().toISOString(),
      sourceFileName: design.sourceFileName || '',
      units: design.units || 'mm',
      extractorVersion: '',
      parentProject: {
        id: '',
        name: '',
      },
    }));
  }

  private transformGraphQLEntitiesResponse(data: any): { elements: AECElement[]; total: number; hasMore: boolean } {
    const entities = data.data?.design?.designEntities?.results || [];
    const pagination = data.data?.design?.designEntities?.pagination;
    
    const elements = entities.map((entity: any) => ({
      id: entity.id,
      name: entity.name || 'Unknown',
      category: entity.classification || 'Unknown',
      family: entity.family,
      type: entity.type,
      level: entity.level,
      room: '',
      properties: entity.properties || [],
      geometry: entity.quantities ? {
        boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
        volume: entity.quantities.volume,
        area: entity.quantities.area,
      } : undefined,
    }));

    return {
      elements,
      total: pagination?.totalResults || elements.length,
      hasMore: (pagination?.offset + pagination?.limit) < pagination?.totalResults,
    };
  }

  private transformPropertiesResponse(data: any): AECProperty[] {
    return data.data?.map((item: any) => ({
      name: item.attributes?.name || '',
      value: item.attributes?.value,
      displayName: item.attributes?.displayName || item.attributes?.name || '',
      category: item.attributes?.category || 'General',
      dataType: item.attributes?.dataType || 'string',
      units: item.attributes?.units,
    })) || [];
  }
}

// Export singleton instance
export const aecDataModelService = new AECDataModelService();

// Export class for testing
export { AECDataModelService };