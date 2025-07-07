import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

/**
 * SMART Translation API - Checks Pre-Translated Models Only
 * 
 * This endpoint ONLY checks for already-translated models from BIM 360/ACC.
 * It will NOT submit new translation jobs to prevent charges.
 * 
 * If a model is already translated in BIM 360, it returns the viewable URN (FREE).
 * If a model needs translation, it refuses and suggests alternatives.
 */

export async function POST(request: NextRequest) {
  console.log('🔍 Smart Translation API: Checking for pre-translated models only...');
  
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, versionId } = body;

    if (!projectId || !versionId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID and Version ID are required'
      }, { status: 400 });
    }

    console.log('🔍 Smart Translation API: Checking pre-translated model for version:', versionId);

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    // Step 1: Get the storage URN from the version (FREE operation)
    console.log('📁 Smart Translation API: Getting storage URN...');
    let storageUrn: string;
    try {
      storageUrn = await apsService.getStorageUrn(projectId, versionId);
      console.log('✅ Smart Translation API: Storage URN obtained:', storageUrn);
    } catch (storageError) {
      console.error('❌ Smart Translation API: Storage URN extraction failed:', storageError);
      
      // Fallback: Try using the versionId directly as storage URN
      if (versionId.startsWith('urn:')) {
        console.log('🔄 Smart Translation API: Using versionId as storage URN (fallback)');
        storageUrn = versionId;
      } else {
        console.log('🔄 Smart Translation API: Attempting to construct storage URN from version data');
        storageUrn = versionId.includes('urn:') ? versionId : `urn:adsk.objects:os.object:${projectId}/${versionId}`;
        console.log('🔄 Smart Translation API: Constructed storage URN:', storageUrn);
      }
    }

    // Step 2: Generate viewer URN (FREE operation)
    const viewerUrn = apsService.getViewerUrn(storageUrn);
    console.log('🎯 Smart Translation API: Viewer URN generated:', viewerUrn);

    // Step 3: Check if already translated (FREE operation - no new translation triggered)
    console.log('🔍 Smart Translation API: Checking if model is already translated...');
    let translationStatus;
    try {
      translationStatus = await apsService.getTranslationStatus(viewerUrn);
      console.log('📊 Smart Translation API: Current status:', translationStatus);
    } catch (statusError) {
      console.log('🔍 Smart Translation API: No existing translation found');
      translationStatus = { status: 'not_started', progress: '0%', hasThumbnail: false };
    }

    // Step 4: Handle based on existing translation status
    if (translationStatus.status === 'success') {
      console.log('✅ Smart Translation API: Model already translated - returning URN (FREE)');
      
      // Get thumbnail URL if available (FREE operation for existing thumbnails)
      let thumbnailUrl = '';
      try {
        if (translationStatus.hasThumbnail) {
          thumbnailUrl = await apsService.getThumbnailUrl(viewerUrn);
          console.log('🖼️ Smart Translation API: Thumbnail URL generated');
        }
      } catch (thumbnailError) {
        console.warn('⚠️ Smart Translation API: Thumbnail not available');
      }

      return NextResponse.json({
        success: true,
        data: {
          storageUrn,
          viewerUrn,
          status: 'success',
          progress: '100%',
          thumbnailUrl,
          message: 'Model is already translated and ready for viewing',
          wasAlreadyTranslated: true,
          usedFreeAPI: true
        }
      });
      
    } else if (translationStatus.status === 'inprogress') {
      console.log('⏳ Smart Translation API: Model translation already in progress');
      return NextResponse.json({
        success: true,
        data: {
          storageUrn,
          viewerUrn,
          status: 'inprogress',
          progress: translationStatus.progress,
          message: 'Model translation is already in progress. Please wait for completion.',
          wasAlreadyTranslated: false,
          usedFreeAPI: true
        }
      });
      
    } else {
      // Model needs translation - we refuse to submit new translation jobs
      console.log('🚫 Smart Translation API: Model needs translation - refusing to prevent charges');
      return NextResponse.json({
        success: false,
        error: 'Model requires translation',
        details: 'This model has not been translated yet. To prevent charges, we do not submit new translation jobs.',
        data: {
          storageUrn,
          viewerUrn,
          status: 'not_translated',
          progress: '0%',
          message: 'Model needs translation but automatic translation is disabled to prevent charges',
          needsTranslation: true,
          usedFreeAPI: true
        },
        suggestions: [
          'Upload this model to BIM 360/ACC and let it process there first',
          'Use models that have already been processed in BIM 360',
          'Contact your BIM 360 administrator to process this model'
        ]
      }, { status: 422 }); // 422 = Unprocessable Entity
    }

  } catch (error) {
    console.error('❌ Smart Translation API: Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Translation check failed';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: 'Failed to check model translation status',
      usedFreeAPI: true
    }, { status: 500 });
  }
}

// GET endpoint to check translation status (FREE operation)
export async function GET(request: NextRequest) {
  console.log('🔍 Smart Translation API: Checking translation status...');
  
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const urn = request.nextUrl.searchParams.get('urn');
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    if (!urn) {
      return NextResponse.json({
        success: false,
        error: 'URN parameter is required'
      }, { status: 400 });
    }

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken);

    // This is a FREE operation - just checking existing status
    const status = await apsService.getTranslationStatus(urn);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: getStatusMessage(status.status),
        usedFreeAPI: true
      }
    });

  } catch (error) {
    console.error('❌ Smart Translation Status API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check translation status',
      usedFreeAPI: true
    }, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'success':
      return 'Model is already translated and ready for viewing';
    case 'inprogress':
      return 'Model translation is in progress. Please wait for completion.';
    case 'failed':
      return 'Model translation failed. Please try re-uploading to BIM 360.';
    case 'timeout':
      return 'Model translation timed out. Please contact support.';
    default:
      return 'Model translation status unknown.';
  }
}