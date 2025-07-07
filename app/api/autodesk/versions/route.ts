import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;
    const projectId = request.nextUrl.searchParams.get('projectId');
    const itemId = request.nextUrl.searchParams.get('itemId');

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!projectId || !itemId) {
      return NextResponse.json({ error: 'Project ID and Item ID are required' }, { status: 400 });
    }

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    const versions = await apsService.getItemVersions(projectId, itemId);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}