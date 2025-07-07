import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;
    const hubId = request.nextUrl.searchParams.get('hubId');
    const projectId = request.nextUrl.searchParams.get('projectId');
    const folderId = request.nextUrl.searchParams.get('folderId');

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    let result;
    if (folderId && projectId) {
      // Get folder contents
      result = await apsService.getFolderContents(projectId, folderId);
      return NextResponse.json({ contents: result });
    } else if (hubId && projectId) {
      // Get top folders for project
      result = await apsService.getProjectTopFolders(hubId, projectId);
      return NextResponse.json({ folders: result });
    } else {
      return NextResponse.json({ error: 'Required parameters missing' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}