import { NextRequest, NextResponse } from 'next/server';
import { updateProject, type APSModelAssignment, getAllProjects } from '@/lib/projectData';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  console.log('🔧 API Route: /api/link-model called');
  
  try {
    const body = await request.json();
    console.log('📝 Request body received:', {
      projectId: body.projectId,
      optionId: body.optionId,
      linkedModel: body.linkedModel ? {
        id: body.linkedModel.id,
        name: body.linkedModel.name,
        fileName: body.linkedModel.fileName,
        status: body.linkedModel.status
      } : null
    });

    const { projectId, optionId, linkedModel } = body;

    // Validate parameters
    if (!projectId || !optionId || !linkedModel) {
      const missingParams = [];
      if (!projectId) missingParams.push('projectId');
      if (!optionId) missingParams.push('optionId');
      if (!linkedModel) missingParams.push('linkedModel');
      
      const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
      console.error('❌ API Validation Error:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
    
    console.log('✅ API Parameter validation passed');
    
    // Get the current project
    console.log('📁 API Loading project data...');
    const projects = getAllProjects();
    console.log('📊 API Total projects loaded:', projects.length);
    
    const project = projects.find(p => p.id === projectId);
    console.log('🎯 API Project found:', project ? `"${project.name}"` : 'NOT FOUND');
    
    if (!project) {
      const errorMessage = `Project not found with ID: ${projectId}`;
      console.error('❌ API Project Error:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    // Check if option exists
    const existingOption = project.options.find(opt => opt.id === optionId);
    console.log('🎯 API Option found:', existingOption ? `"${existingOption.name}"` : 'NOT FOUND');
    
    if (!existingOption) {
      const errorMessage = `Option not found with ID: ${optionId} in project ${projectId}`;
      console.error('❌ API Option Error:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    // Update the specific option's linked model
    console.log('🔄 API Updating option with linked model...');
    const updatedOptions = project.options.map(option => 
      option.id === optionId 
        ? { ...option, linkedModel }
        : option
    );

    console.log('💾 API Saving project data...');
    // Update the project
    const updateResult = updateProject(projectId, { options: updatedOptions });
    console.log('💾 API Update result:', updateResult ? 'SUCCESS' : 'FAILED');
    
    // Revalidate all related pages
    console.log('🔄 API Revalidating pages...');
    revalidatePath(`/projects/${projectId}/option-${optionId}`);
    revalidatePath(`/projects/${projectId}/option-${optionId}/link-model`);
    
    console.log('✅ API Route completed successfully');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ API Route Error:', error);
    console.error('❌ API Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ API Returning error:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}