import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    const hubs = await apsService.getHubs();
    
    // Log hub details for debugging
    console.log('Hubs API: Found', hubs.length, 'hubs');
    hubs.forEach((hub, index) => {
      console.log(`Hub ${index + 1}:`, {
        id: hub.id,
        name: hub.attributes.name,
        type: hub.attributes.extension?.type,
        region: hub.attributes.extension?.data?.region
      });
    });
    
    return NextResponse.json({ hubs });
  } catch (error) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json({ error: 'Failed to fetch hubs' }, { status: 500 });
  }
}