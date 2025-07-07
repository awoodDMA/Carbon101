import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth';
import { aecViewerService } from '@/lib/aec-viewer-service';

/**
 * FREE API endpoint to link models using only AEC Data Model
 * This replaces the premium translation-based model linking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, optionId, designId, modelName } = body;

    if (!projectId || !optionId || !designId) {
      return NextResponse.json(
        { error: 'Project ID, Option ID, and Design ID are required' },
        { status: 400 }
      );
    }

    console.log('🔗 AEC Link Model API: Linking model using FREE APIs:', {
      projectId, optionId, designId, modelName
    });

    // Get access token for Autodesk APS
    const tokenData = await getAccessToken(request);
    if (!tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Link model using FREE AEC Data Model APIs only
    const linkingData = await aecViewerService.linkModelToOption(
      projectId,
      optionId,
      designId,
      modelName || 'Unknown Model'
    );

    console.log('✅ AEC Link Model API: Model linked successfully using FREE APIs');

    return NextResponse.json({
      success: true,
      data: linkingData,
      usedFreeAPI: true,
      message: 'Model linked successfully using FREE AEC Data Model API - no charges incurred'
    });

  } catch (error) {
    console.error('❌ AEC Link Model API: Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to link model',
        details: error instanceof Error ? error.message : 'Unknown error',
        usedFreeAPI: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve linked model for an option
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const optionId = url.searchParams.get('optionId');

    if (!projectId || !optionId) {
      return NextResponse.json(
        { error: 'Project ID and Option ID are required' },
        { status: 400 }
      );
    }

    console.log('📊 AEC Link Model API: Getting linked model for option:', optionId);

    // Get access token for Autodesk APS
    const tokenData = await getAccessToken(request);
    if (!tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Get linked model using FREE APIs
    const linkedModel = await aecViewerService.getLinkedModel(projectId, optionId);

    return NextResponse.json({
      success: true,
      data: linkedModel,
      hasLinkedModel: !!linkedModel,
      usedFreeAPI: true
    });

  } catch (error) {
    console.error('❌ AEC Link Model API: Error getting linked model:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get linked model',
        details: error instanceof Error ? error.message : 'Unknown error',
        usedFreeAPI: true
      },
      { status: 500 }
    );
  }
}