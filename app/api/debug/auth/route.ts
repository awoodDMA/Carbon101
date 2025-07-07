import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('aps_access_token')?.value;
  const refreshToken = request.cookies.get('aps_refresh_token')?.value;
  
  return NextResponse.json({
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    timestamp: new Date().toISOString()
  });
}