import { NextRequest, NextResponse } from 'next/server';
import { AutodeskAPSService } from '@/lib/autodesk-aps';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Authentication failed';
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      new URL('/?auth_error=Missing authorization code', request.url)
    );
  }

  try {
    console.log('Callback: Initializing APS service...');
    // Initialize APS service
    const apsService = new AutodeskAPSService(
      process.env.NEXT_PUBLIC_APS_CLIENT_ID,
      process.env.APS_CLIENT_SECRET
    );

    console.log('Callback: Exchanging code for tokens...');
    // Exchange code for tokens
    const tokens = await apsService.exchangeCodeForToken(code);
    console.log('Callback: Got tokens:', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in 
    });

    // Create success response with tokens
    const response = NextResponse.redirect(new URL('/?auth_success=true&refresh_user=true', request.url));
    console.log('Callback: Setting cookies...');
    
    // Set secure cookies with tokens
    response.cookies.set('aps_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in - 300, // Expire 5 minutes before actual expiry
    });

    if (tokens.refresh_token) {
      response.cookies.set('aps_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    console.log('Callback: Cookies set, redirecting...');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}