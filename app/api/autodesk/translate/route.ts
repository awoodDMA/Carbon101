import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function POST(request: NextRequest) {
  console.log('🔧 Translation API: Starting translation request...');
  
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

    console.log('🔧 Translation API: Processing translation for version:', versionId);

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    // Step 1: Get the storage URN from the version
    console.log('📁 Translation API: Getting storage URN...');
    console.log('📁 Translation API: Input versionId:', versionId);
    console.log('📁 Translation API: Input projectId:', projectId);
    
    let storageUrn: string;
    try {
      storageUrn = await apsService.getStorageUrn(projectId, versionId);
      console.log('✅ Translation API: Storage URN obtained:', storageUrn);
    } catch (storageError) {
      console.error('❌ Translation API: Storage URN extraction failed:', storageError);
      
      // Fallback: Try using the versionId directly as storage URN if it looks like a proper URN
      if (versionId.startsWith('urn:')) {
        console.log('🔄 Translation API: Using versionId as storage URN (fallback)');
        storageUrn = versionId;
      } else {
        console.log('🔄 Translation API: Attempting to construct storage URN from version data');
        // Sometimes the version ID needs to be constructed as a storage URN
        // This is a common pattern in Autodesk APIs
        storageUrn = versionId.includes('urn:') ? versionId : `urn:adsk.objects:os.object:${projectId}/${versionId}`;
        console.log('🔄 Translation API: Constructed storage URN:', storageUrn);
      }
    }

    // Step 2: Generate viewer URN
    const viewerUrn = apsService.getViewerUrn(storageUrn);
    console.log('🎯 Translation API: Viewer URN generated:', viewerUrn);

    // Step 3: Check if already translated
    console.log('🔍 Translation API: Checking existing translation status...');
    let translationStatus;
    try {
      translationStatus = await apsService.getTranslationStatus(viewerUrn);
      console.log('📊 Translation API: Current status:', translationStatus);
    } catch (statusError) {
      console.log('🔍 Translation API: No existing translation found');
      translationStatus = { status: 'not_started', progress: '0%', hasThumbnail: false };
    }

    // Step 4: Submit for translation if needed
    let translationResult;
    if (translationStatus.status === 'success') {
      console.log('✅ Translation API: Model already translated successfully');
      translationResult = {
        urn: viewerUrn,
        status: 'success',
        progress: '100%'
      };
    } else if (translationStatus.status === 'inprogress') {
      console.log('⏳ Translation API: Translation already in progress');
      translationResult = {
        urn: viewerUrn,
        status: 'inprogress',
        progress: translationStatus.progress
      };
    } else {
      console.log('🚀 Translation API: Submitting model for translation...');
      translationResult = await apsService.translateModel(storageUrn);
      console.log('✅ Translation API: Translation submitted:', translationResult);
    }

    // Step 5: Get thumbnail URL if available
    let thumbnailUrl = '';
    try {
      if (translationStatus.hasThumbnail || translationResult.status === 'success') {
        thumbnailUrl = await apsService.getThumbnailUrl(viewerUrn);
        console.log('🖼️ Translation API: Thumbnail URL generated');
      }
    } catch (thumbnailError) {
      console.warn('⚠️ Translation API: Thumbnail not available yet');
    }

    return NextResponse.json({
      success: true,
      data: {
        storageUrn,
        viewerUrn,
        status: translationResult.status,
        progress: (translationResult as any).progress || translationStatus.progress,
        thumbnailUrl,
        message: getStatusMessage(translationResult.status)
      }
    });

  } catch (error) {
    console.error('❌ Translation API: Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Translation failed';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: 'Failed to translate model for viewing'
    }, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'success':
      return 'Model translation completed successfully';
    case 'inprogress':
      return 'Model translation is in progress. This may take several minutes.';
    case 'failed':
      return 'Model translation failed. Please try again or contact support.';
    case 'timeout':
      return 'Model translation timed out. Please try again.';
    default:
      return 'Model translation has been queued for processing.';
  }
}

// GET endpoint to check translation status
export async function GET(request: NextRequest) {
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

    const status = await apsService.getTranslationStatus(urn);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: getStatusMessage(status.status)
      }
    });

  } catch (error) {
    console.error('❌ Translation Status API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check translation status'
    }, { status: 500 });
  }
}