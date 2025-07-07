import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the cookies
    const accessToken = request.cookies.get('aps_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    // Return the token for the viewer to use
    return NextResponse.json({ 
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
  }
}