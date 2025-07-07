'use server';

import { updateProject, type APSModelAssignment } from '@/lib/projectData';
import { revalidatePath } from 'next/cache';

export async function updateProjectModels(
  projectId: string, 
  optionId: string, 
  models: APSModelAssignment[]
) {
  try {
    // Get the current project
    const { getAllProjects } = await import('@/lib/projectData');
    const projects = getAllProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Update the specific option's APS models
    const updatedOptions = project.options.map(option => 
      option.id === optionId 
        ? { ...option, apsModels: models }
        : option
    );

    // Update the project
    updateProject(projectId, { options: updatedOptions });
    
    // Revalidate the page to show updated data
    revalidatePath(`/projects/${projectId}/option-${optionId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update project models:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateProjectLinkedModel(
  projectId: string,
  optionId: string, 
  linkedModel: APSModelAssignment
) {
  console.log('🔧 Server Action: updateProjectLinkedModel called');
  console.log('📝 Parameters received:', {
    projectId: projectId,
    optionId: optionId,
    linkedModel: linkedModel ? {
      id: linkedModel.id,
      name: linkedModel.name,
      fileName: linkedModel.fileName,
      status: linkedModel.status
    } : null
  });

  try {
    // Validate parameters
    if (!projectId || !optionId || !linkedModel) {
      const missingParams = [];
      if (!projectId) missingParams.push('projectId');
      if (!optionId) missingParams.push('optionId');
      if (!linkedModel) missingParams.push('linkedModel');
      
      const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
      console.error('❌ Validation Error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Parameter validation passed');
    
    // Get the current project
    console.log('📁 Loading project data...');
    const { getAllProjects } = await import('@/lib/projectData');
    const projects = getAllProjects();
    console.log('📊 Total projects loaded:', projects.length);
    
    const project = projects.find(p => p.id === projectId);
    console.log('🎯 Project found:', project ? `"${project.name}"` : 'NOT FOUND');
    
    if (!project) {
      const errorMessage = `Project not found with ID: ${projectId}`;
      console.error('❌ Project Error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Check if option exists
    const existingOption = project.options.find(opt => opt.id === optionId);
    console.log('🎯 Option found:', existingOption ? `"${existingOption.name}"` : 'NOT FOUND');
    
    if (!existingOption) {
      const errorMessage = `Option not found with ID: ${optionId} in project ${projectId}`;
      console.error('❌ Option Error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Update the specific option's linked model
    console.log('🔄 Updating option with linked model...');
    const updatedOptions = project.options.map(option => 
      option.id === optionId 
        ? { ...option, linkedModel }
        : option
    );

    console.log('💾 Saving project data...');
    // Update the project
    const updateResult = updateProject(projectId, { options: updatedOptions });
    console.log('💾 Update result:', updateResult ? 'SUCCESS' : 'FAILED');
    
    // Revalidate all related pages
    console.log('🔄 Revalidating pages...');
    revalidatePath(`/projects/${projectId}/option-${optionId}`);
    revalidatePath(`/projects/${projectId}/option-${optionId}/link-model`);
    
    console.log('✅ Server Action completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Server Action Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Returning error:', errorMessage);
    
    return { success: false, error: errorMessage };
  }
}