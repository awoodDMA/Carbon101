import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { urn, accessToken } = await request.json();
    
    console.log('🔍 Testing viewer URN and token...');
    console.log('URN:', urn);
    console.log('Token length:', accessToken?.length || 0);
    
    if (!urn || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'URN and access token are required'
      }, { status: 400 });
    }

    // Test 1: Check if URN is base64 encoded properly
    let decodedUrn;
    let cleanUrn = urn;
    
    // Remove urn: prefix if present for decoding
    if (urn.startsWith('urn:')) {
      cleanUrn = urn.substring(4);
    }
    
    try {
      decodedUrn = atob(cleanUrn);
      console.log('✅ URN decoded successfully:', decodedUrn);
    } catch (error) {
      console.error('❌ URN is not valid base64:', error);
      return NextResponse.json({
        success: false,
        error: 'URN is not valid base64 encoded',
        details: { urn, cleanUrn, decodedUrn: null }
      });
    }

    // Test 2: Check if decoded URN has proper format
    if (!decodedUrn.startsWith('urn:adsk.objects:os.object:')) {
      console.error('❌ Decoded URN does not have expected format');
      return NextResponse.json({
        success: false,
        error: 'Decoded URN does not start with expected prefix',
        details: { urn, decodedUrn }
      });
    }

    // Test 3: Test token with Autodesk API
    try {
      const response = await fetch('https://developer.api.autodesk.com/userprofile/v1/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        console.error('❌ Token validation failed:', response.status, response.statusText);
        return NextResponse.json({
          success: false,
          error: `Token validation failed: ${response.status} ${response.statusText}`,
          details: { urn, decodedUrn, tokenValid: false }
        });
      }

      const userProfile = await response.json();
      console.log('✅ Token is valid, user:', userProfile.userName);

    } catch (tokenError) {
      console.error('❌ Token test failed:', tokenError);
      return NextResponse.json({
        success: false,
        error: 'Failed to validate token with Autodesk API',
        details: { urn, decodedUrn, tokenError: tokenError instanceof Error ? tokenError.message : 'Unknown error' }
      });
    }

    // Test 4: Check manifest status
    try {
      // Use the already cleaned URN (without urn: prefix) for the API call
      const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodeURIComponent(cleanUrn)}/manifest`;
      console.log('🔍 Original URN:', urn);
      console.log('🔍 Clean URN for API:', cleanUrn);
      console.log('🔍 Checking manifest at:', manifestUrl);
      
      const manifestResponse = await fetch(manifestUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!manifestResponse.ok) {
        console.error('❌ Manifest check failed:', manifestResponse.status, manifestResponse.statusText);
        const errorText = await manifestResponse.text();
        console.error('❌ Manifest error response:', errorText);
        
        return NextResponse.json({
          success: false,
          error: `Manifest check failed: ${manifestResponse.status} ${manifestResponse.statusText}`,
          details: { 
            urn, 
            decodedUrn, 
            tokenValid: true, 
            manifestStatus: manifestResponse.status,
            manifestError: errorText
          }
        });
      }

      const manifest = await manifestResponse.json();
      console.log('✅ Manifest retrieved:', manifest.status);

      return NextResponse.json({
        success: true,
        data: {
          urn,
          decodedUrn,
          tokenValid: true,
          manifestStatus: manifest.status,
          derivatives: manifest.derivatives?.length || 0,
          ready: manifest.status === 'success'
        }
      });

    } catch (manifestError) {
      console.error('❌ Manifest check error:', manifestError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check manifest',
        details: { 
          urn, 
          decodedUrn, 
          tokenValid: true, 
          manifestError: manifestError instanceof Error ? manifestError.message : 'Unknown error' 
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}