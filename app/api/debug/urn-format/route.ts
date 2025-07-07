import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, versionId } = body;

    console.log('🔍 Debug URN Format:');
    console.log('- Project ID:', projectId);
    console.log('- Project ID length:', projectId?.length);
    console.log('- Project ID starts with urn:', projectId?.startsWith?.('urn:'));
    console.log('- Version ID:', versionId);
    console.log('- Version ID length:', versionId?.length);
    console.log('- Version ID starts with urn:', versionId?.startsWith?.('urn:'));
    console.log('- Version ID format check:', versionId?.includes?.('urn:adsk'));

    // Check if these look like valid URNs
    const projectIdValid = projectId && (projectId.startsWith('b.') || projectId.startsWith('urn:'));
    const versionIdValid = versionId && versionId.startsWith('urn:');

    const analysis = {
      projectId: {
        value: projectId,
        length: projectId?.length,
        startsWithUrn: projectId?.startsWith?.('urn:'),
        startsWithB: projectId?.startsWith?.('b.'),
        isValid: projectIdValid
      },
      versionId: {
        value: versionId,
        length: versionId?.length,
        startsWithUrn: versionId?.startsWith?.('urn:'),
        containsAdsk: versionId?.includes?.('urn:adsk'),
        isValid: versionIdValid
      },
      suggestedUrls: {
        dataManagementVersion: `https://developer.api.autodesk.com/data/v1/projects/${projectId}/versions/${versionId}`,
        modelDerivativeManifest: versionId ? `https://developer.api.autodesk.com/modelderivative/v2/designdata/${btoa(versionId).replace(/=/g, '')}/manifest` : null
      }
    };

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: {
        projectId: projectIdValid ? 'Valid' : 'Invalid - should start with "b." or "urn:"',
        versionId: versionIdValid ? 'Valid' : 'Invalid - should start with "urn:adsk"',
        nextSteps: !projectIdValid || !versionIdValid ? 
          'Check how URNs are being extracted from API responses' : 
          'URNs look valid, check API permissions and encoding'
      }
    });

  } catch (error) {
    console.error('Debug URN Format error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 });
  }
}