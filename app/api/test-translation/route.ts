import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Test Translation: Starting test...');
  
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('aps_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No access token found. Please authenticate first.'
      }, { status: 401 });
    }

    console.log('🔑 Test Translation: Access token found');

    // Test Model Derivative API access
    const testUrn = 'dXJuOmFkc2s6aW86ZnM6ZmllOnJUSnE2VklXdGNSQ3Z0TlFfLjEuSnA2QT0xNjI0NDQz'; // Sample URN
    
    const response = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${testUrn}/manifest`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('🧪 Test Translation: API response status:', response.status);
    
    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Token may be invalid or expired.',
        details: 'Need to re-authenticate with proper scopes'
      });
    }

    if (response.status === 403) {
      return NextResponse.json({
        success: false,
        error: 'Permission denied. Missing required scopes.',
        details: 'App needs code:all scope for Model Derivative API'
      });
    }

    // Test translation job submission with minimal payload
    const translationResponse = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          urn: testUrn
        },
        output: {
          formats: [
            {
              type: 'svf2',
              views: ['3d']
            }
          ]
        }
      })
    });

    const translationText = await translationResponse.text();
    console.log('🧪 Test Translation: Job submission status:', translationResponse.status);
    console.log('🧪 Test Translation: Job submission response:', translationText);

    if (translationResponse.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed for translation job',
        details: 'Token invalid for Model Derivative API'
      });
    }

    if (translationResponse.status === 403) {
      return NextResponse.json({
        success: false,
        error: 'Permission denied for translation job',
        details: 'Missing code:all or viewables:read scope'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Model Derivative API access verified',
      details: {
        manifestStatus: response.status,
        translationStatus: translationResponse.status,
        hasPermissions: translationResponse.status !== 403,
        canAccessAPI: response.status !== 401
      }
    });

  } catch (error) {
    console.error('🧪 Test Translation: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to test Model Derivative API access'
    }, { status: 500 });
  }
}