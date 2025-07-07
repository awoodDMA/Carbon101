'use server';

import { updateOptionLinkedModel, updateOptionApsModels, type APSModelAssignment } from '@/lib/relational-data';
import { revalidatePath } from 'next/cache';

export async function updateProjectModels(
  projectId: string, 
  optionId: string, 
  models: APSModelAssignment[]
) {
  try {
    // Update using relational data structure
    const success = updateOptionApsModels(projectId, optionId.toUpperCase(), models);
    
    if (!success) {
      throw new Error(`Failed to update models for project ${projectId}, option ${optionId}`);
    }
    
    // Revalidate the page to show updated data
    revalidatePath(`/projects/${projectId}/option-${optionId}`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateProjectLinkedModel(
  projectId: string,
  optionId: string, 
  linkedModel: APSModelAssignment
) {
  console.log('🚀 Server Action: updateProjectLinkedModel called with:', {
    projectId,
    optionId,
    linkedModelName: linkedModel.name,
    linkedModelStatus: linkedModel.status
  });

  try {
    // Validate parameters
    if (!projectId || !optionId || !linkedModel) {
      const missingParams = [];
      if (!projectId) missingParams.push('projectId');
      if (!optionId) missingParams.push('optionId');
      if (!linkedModel) missingParams.push('linkedModel');
      
      const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
      console.error('❌ Server Action: Validation failed:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Server Action: Validation passed, calling updateOptionLinkedModel...');
    
    // Update using relational data structure
    const success = updateOptionLinkedModel(projectId, optionId.toUpperCase(), linkedModel);
    
    if (!success) {
      const errorMessage = `Failed to update linked model for project ${projectId}, option ${optionId}`;
      console.error('❌ Server Action: Update failed:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Server Action: Update successful, revalidating paths...');
    
    // Revalidate all related pages
    revalidatePath(`/projects/${projectId}/option-${optionId}`);
    revalidatePath(`/projects/${projectId}/option-${optionId}/link-model`);
    
    console.log('✅ Server Action: Completed successfully');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}