import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  try {
    console.log('APS status check - checking cookies...');
    // Check if we have APS tokens in cookies
    const accessToken = request.cookies.get('aps_access_token')?.value;
    const refreshToken = request.cookies.get('aps_refresh_token')?.value;

    console.log('Access token exists:', !!accessToken);
    console.log('Refresh token exists:', !!refreshToken);

    if (!accessToken) {
      console.log('No access token found, returning not connected');
      return NextResponse.json({ isConnected: false });
    }

    // Initialize APS service with tokens
    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );
    
    apsService.setToken(accessToken, refreshToken);

    try {
      // Test the connection by getting user info
      const userInfo = await apsService.getUserInfo();
      
      return NextResponse.json({
        isConnected: true,
        userInfo: userInfo,
      });
    } catch (error) {
      // Token might be expired or invalid
      console.error('APS connection check failed:', error);
      
      // Clear invalid cookies
      const response = NextResponse.json({ isConnected: false });
      response.cookies.delete('aps_access_token');
      response.cookies.delete('aps_refresh_token');
      
      return response;
    }
  } catch (error) {
    console.error('Error checking APS status:', error);
    return NextResponse.json({ isConnected: false });
  }
}