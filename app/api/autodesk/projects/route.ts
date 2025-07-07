import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;
    const hubId = request.nextUrl.searchParams.get('hubId');

    console.log('Projects API: Received request for hubId:', hubId);
    console.log('Projects API: Has access token:', !!accessToken);

    if (!accessToken) {
      console.log('Projects API: No access token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hubId) {
      console.log('Projects API: No hub ID provided');
      return NextResponse.json({ error: 'Hub ID is required' }, { status: 400 });
    }

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    console.log('Projects API: Fetching projects for hub:', hubId);
    const projects = await apsService.getProjects(hubId);
    console.log('Projects API: Found', projects.length, 'projects');
    
    // Log detailed response for debugging
    if (projects.length === 0) {
      console.log('Projects API: No projects found. This could mean:');
      console.log('1. Hub has no projects assigned');
      console.log('2. APS app not provisioned in ACC account');
      console.log('3. Missing API scopes');
      console.log('4. Personal hub instead of company hub');
    }
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Projects API: Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}