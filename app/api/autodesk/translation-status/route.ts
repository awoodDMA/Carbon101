import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

/**
 * Smart Translation Status API - Checks Existing Translations Only
 * 
 * This endpoint checks the status of existing translations without triggering new ones.
 * This is a FREE operation for models already processed in BIM 360/ACC.
 */

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

    console.log('🔍 Translation Status: Checking status for URN:', urn);
    
    // This is a FREE operation - just checking existing status, not triggering translation
    const status = await apsService.getTranslationStatus(urn);
    console.log('📊 Translation Status: Current status:', status);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: getStatusMessage(status.status),
        isComplete: status.status === 'success',
        isProcessing: status.status === 'inprogress',
        isFailed: status.status === 'failed',
        usedFreeAPI: true,
        note: 'This is a free operation checking existing translation status only'
      }
    });

  } catch (error) {
    console.error('❌ Translation Status API: Error:', error);
    
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