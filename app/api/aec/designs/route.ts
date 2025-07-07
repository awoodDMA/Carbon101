import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth';
import { aecDataModelService } from '@/lib/aec-data-model';

/**
 * FREE API endpoint to get designs from AEC Data Model
 * This replaces the premium translation API calls
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 AEC Designs API: Getting designs for project:', projectId);

    // Get access token for Autodesk APS
    const tokenData = await getAccessToken(request);
    if (!tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Get designs using FREE AEC Data Model API
    const designs = await aecDataModelService.getProjectDesigns(projectId);

    console.log('✅ AEC Designs API: Retrieved designs:', designs.length);

    return NextResponse.json({
      success: true,
      data: designs,
      count: designs.length,
      usedFreeAPI: true,
      message: 'Designs retrieved using FREE AEC Data Model API'
    });

  } catch (error) {
    console.error('❌ AEC Designs API: Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get designs',
        details: error instanceof Error ? error.message : 'Unknown error',
        usedFreeAPI: true
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to check design viewability without triggering translation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, designId } = body;

    if (!projectId || !designId) {
      return NextResponse.json(
        { error: 'Project ID and Design ID are required' },
        { status: 400 }
      );
    }

    console.log('🔍 AEC Designs API: Checking viewability for:', designId);

    // Get access token for Autodesk APS
    const tokenData = await getAccessToken(request);
    if (!tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Get design details using FREE AEC Data Model API
    const modelSet = await aecDataModelService.getModelSet(projectId, designId);

    if (!modelSet) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Return design information without triggering any premium APIs
    return NextResponse.json({
      success: true,
      data: {
        designId: modelSet.id,
        name: modelSet.name,
        status: modelSet.status,
        sourceFileName: modelSet.sourceFileName,
        isReady: modelSet.status === 'ready',
        // Note: We don't provide viewerUrn here to avoid premium API calls
        // The frontend will need to handle viewing differently
        message: modelSet.status === 'ready' 
          ? 'Design is ready - may be viewable through AEC Data Model'
          : 'Design is not ready for viewing'
      },
      usedFreeAPI: true
    });

  } catch (error) {
    console.error('❌ AEC Designs API: Error checking design:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check design',
        details: error instanceof Error ? error.message : 'Unknown error',
        usedFreeAPI: true
      },
      { status: 500 }
    );
  }
}