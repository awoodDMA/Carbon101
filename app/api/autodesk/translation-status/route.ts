import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

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
    const status = await apsService.getTranslationStatus(urn);
    console.log('📊 Translation Status: Current status:', status);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: getStatusMessage(status.status),
        isComplete: status.status === 'success',
        isProcessing: status.status === 'inprogress',
        isFailed: status.status === 'failed'
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
      return 'Model translation status unknown.';
  }
}