/**
 * AEC Data Model Viewer Service
 * 
 * This service bridges the gap between AEC Data Model and the Viewer SDK
 * using only FREE APIs. It determines if models are already viewable
 * or finds alternative ways to display them.
 */

import { aecDataModelService, AECModelSet } from './aec-data-model';
import { apsService } from './autodesk-aps';

export interface ViewableModel {
  designId: string;
  viewerUrn?: string;
  thumbnailUrl?: string;
  status: 'ready' | 'processing' | 'failed' | 'not_viewable';
  message: string;
  isViewable: boolean;
  sourceUrn?: string;
  alternativeUrl?: string;
}

export interface ModelLinkingData {
  projectId: string;
  optionId: string;
  modelId: string;
  modelName: string;
  viewableModel: ViewableModel;
}

class AECViewerService {
  
  /**
   * Get viewable model data for a design using FREE APIs only
   */
  async getViewableModel(projectId: string, designId: string): Promise<ViewableModel> {
    console.log('🔍 AECViewerService: Getting viewable model for design:', designId);
    
    try {
      // Step 1: Get the design details from AEC Data Model (FREE)
      const modelSet = await aecDataModelService.getModelSet(projectId, designId);
      
      if (!modelSet) {
        return {
          designId,
          status: 'failed',
          message: 'Design not found',
          isViewable: false
        };
      }

      // Step 2: Check if the model is already viewable
      // AEC Data Model designs that have gone through processing should have viewable URNs
      const viewableData = await this.checkViewableStatus(modelSet);
      
      return viewableData;
      
    } catch (error) {
      console.error('❌ AECViewerService: Error getting viewable model:', error);
      return {
        designId,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        isViewable: false
      };
    }
  }
  
  /**
   * Check if a model set has viewable data available
   * This uses only FREE APIs
   */
  private async checkViewableStatus(modelSet: AECModelSet): Promise<ViewableModel> {
    console.log('🔍 AECViewerService: Checking viewable status for:', modelSet.name);
    
    // The key insight: AEC Data Model designs might already be processed
    // and have viewable URNs available without needing Model Derivative API
    
    if (modelSet.status === 'ready') {
      // For designs that are "ready", they should have viewable data
      // Let's construct the viewer URN from the design ID
      const possibleViewerUrn = this.constructViewerUrnFromDesign(modelSet.id);
      
      // Check if this URN is actually viewable (this might fail, which is OK)
      const isActuallyViewable = await this.testViewerUrn(possibleViewerUrn);
      
      if (isActuallyViewable) {
        return {
          designId: modelSet.id,
          viewerUrn: possibleViewerUrn,
          status: 'ready',
          message: 'Model is ready for viewing',
          isViewable: true,
          sourceUrn: possibleViewerUrn
        };
      }
    }
    
    // Alternative approach: Check if the original file has a viewable format
    if (this.isNativelyViewableFormat(modelSet.sourceFileName)) {
      return {
        designId: modelSet.id,
        status: 'ready',
        message: 'Model can be viewed in native format',
        isViewable: true,
        alternativeUrl: this.getNativeViewerUrl(modelSet)
      };
    }
    
    // If we get here, the model might need processing but we'll try to work around it
    return {
      designId: modelSet.id,
      status: 'not_viewable',
      message: 'Model format not supported for viewing without translation',
      isViewable: false
    };
  }
  
  /**
   * Construct a viewer URN from design ID
   * This attempts to create a viewable URN using patterns from AEC Data Model
   */
  private constructViewerUrnFromDesign(designId: string): string {
    // AEC Data Model designs might have predictable URN patterns
    // This is speculative - we'll test if it works
    if (designId.startsWith('urn:')) {
      return designId; // Already a URN
    }
    
    // Try to construct a viewer URN
    // Format might be: urn:adsk.viewing:fs.file:{designId}
    return `urn:adsk.viewing:fs.file:${designId}`;
  }
  
  /**
   * Test if a URN is actually viewable without triggering translation
   */
  private async testViewerUrn(urn: string): Promise<boolean> {
    try {
      const token = apsService.getAccessToken();
      if (!token) return false;
      
      // This is a lightweight check that doesn't trigger translation
      // We're just checking if the URN exists and is viewable
      const response = await fetch(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodeURIComponent(urn.substring(4))}/manifest`,
        {
          method: 'HEAD', // HEAD request doesn't trigger processing
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      // If we get 200, the model is already viewable
      // If we get 404, it needs translation (which we won't do)
      // If we get other errors, there might be permission issues
      return response.status === 200;
      
    } catch (error) {
      console.warn('⚠️ AECViewerService: Could not test URN viability:', error);
      return false;
    }
  }
  
  /**
   * Check if a file format can be viewed natively (without translation)
   */
  private isNativelyViewableFormat(fileName: string): boolean {
    if (!fileName) return false;
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    // Some formats that might be viewable without translation
    const nativelyViewableFormats = [
      'dwg', // Native AutoCAD format
      'ifc', // Industry Foundation Classes - might be supported
      'step', 'stp', // STEP files
      'iges', 'igs', // IGES files
    ];
    
    return nativelyViewableFormats.includes(extension || '');
  }
  
  /**
   * Get a native viewer URL for formats that don't need translation
   */
  private getNativeViewerUrl(modelSet: AECModelSet): string {
    // This would return a URL for viewing native formats
    // Implementation depends on what Autodesk supports
    return `/viewer/native?design=${modelSet.id}`;
  }
  
  /**
   * Get designs from a project that are potentially viewable
   */
  async getViewableDesigns(projectId: string): Promise<ViewableModel[]> {
    console.log('🔍 AECViewerService: Getting viewable designs for project:', projectId);
    
    try {
      const designs = await aecDataModelService.getProjectDesigns(projectId);
      
      const viewableModels = await Promise.all(
        designs.map(design => this.checkViewableStatus(design))
      );
      
      // Filter to only return models that are actually viewable
      return viewableModels.filter(model => model.isViewable);
      
    } catch (error) {
      console.error('❌ AECViewerService: Error getting viewable designs:', error);
      return [];
    }
  }
  
  /**
   * Link a viewable model to a project option
   */
  async linkModelToOption(
    projectId: string, 
    optionId: string, 
    designId: string,
    modelName: string
  ): Promise<ModelLinkingData> {
    console.log('🔗 AECViewerService: Linking model to option:', { projectId, optionId, designId });
    
    const viewableModel = await this.getViewableModel(projectId, designId);
    
    if (!viewableModel.isViewable) {
      throw new Error(`Model "${modelName}" is not viewable: ${viewableModel.message}`);
    }
    
    const linkingData: ModelLinkingData = {
      projectId,
      optionId,
      modelId: designId,
      modelName,
      viewableModel
    };
    
    // Store this linking data (in a real app, save to database)
    await this.storeLinkingData(linkingData);
    
    console.log('✅ AECViewerService: Model linked successfully');
    return linkingData;
  }
  
  /**
   * Store model linking data
   */
  private async storeLinkingData(linkingData: ModelLinkingData): Promise<void> {
    // In a real implementation, store to database
    // For now, just log
    console.log('💾 AECViewerService: Storing linking data:', linkingData);
    
    // TODO: Implement database storage
    // await database.modelLinks.create(linkingData);
  }
  
  /**
   * Get linked model for an option
   */
  async getLinkedModel(projectId: string, optionId: string): Promise<ModelLinkingData | null> {
    // In a real implementation, retrieve from database
    // For now, return null (no linked model)
    console.log('📊 AECViewerService: Getting linked model for:', { projectId, optionId });
    
    // TODO: Implement database retrieval
    // return await database.modelLinks.findByOption(projectId, optionId);
    return null;
  }
}

// Export singleton instance
export const aecViewerService = new AECViewerService();

// Export class for testing
export { AECViewerService };