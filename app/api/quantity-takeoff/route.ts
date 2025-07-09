import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth';
import { aecQuantityTakeoffService, AECQuantityTakeoffResult } from '@/lib/aec-quantity-takeoff';

/**
 * API endpoint to perform quantity takeoff on a BIM model using FREE AEC Data Model API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designId, projectId, optionId, force = false } = body;

    if (!designId) {
      return NextResponse.json(
        { error: 'Design ID is required for AEC Data Model API' },
        { status: 400 }
      );
    }

    if (!projectId || !optionId) {
      return NextResponse.json(
        { error: 'Project ID and Option ID are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting FREE AEC quantity takeoff for:', { designId, projectId, optionId });

    // Get access token for Autodesk APS with detailed logging
    console.log('🔑 Attempting to get access token...');
    const tokenData = await getAccessToken(request);
    console.log('🔑 Token result:', {
      hasToken: !!tokenData,
      hasAccessToken: !!tokenData?.access_token,
      tokenType: tokenData?.token_type,
      expiresIn: tokenData?.expires_in
    });
    
    if (!tokenData?.access_token) {
      console.error('❌ Failed to obtain access token - tokenData:', tokenData);
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Check if takeoff already exists (unless forced)
    if (!force) {
      console.log('🔍 Checking for existing takeoff...');
      const existingTakeoff = await getExistingTakeoff(designId, projectId, optionId);
      if (existingTakeoff) {
        console.log('📊 Returning existing FREE takeoff results for option:', optionId);
        return NextResponse.json({
          success: true,
          data: existingTakeoff,
          cached: true,
          usedFreeAPI: true
        });
      }
      console.log('🔍 No existing takeoff found, proceeding with fresh analysis');
    }

    // Perform quantity takeoff using FREE AEC Data Model API
    console.log('🚀 Calling aecQuantityTakeoffService.performQuantityTakeoff with:', {
      designId,
      projectId,
      tokenAvailable: !!tokenData.access_token
    });
    
    const takeoffResult = await aecQuantityTakeoffService.performQuantityTakeoff(
      designId,
      projectId
    );
    
    console.log('✅ Takeoff service returned result:', {
      hasResult: !!takeoffResult,
      designId: takeoffResult?.designId,
      totalElements: takeoffResult?.totalElements,
      materialsCount: takeoffResult?.materials?.length
    });

    // Store results for future use
    await storeTakeoffResults(takeoffResult);

    console.log('✅ FREE AEC quantity takeoff completed successfully - NO CHARGES INCURRED');
    return NextResponse.json({
      success: true,
      data: takeoffResult,
      cached: false,
      usedFreeAPI: true,
      message: 'Quantity takeoff completed using FREE AEC Data Model API - no charges incurred'
    });

  } catch (error) {
    console.error('❌ FREE AEC quantity takeoff failed:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('📝 Error Details:');
      console.error('  - Name:', error.name);
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      console.error('  - Cause:', error.cause);
    } else {
      console.error('📝 Non-Error object thrown:', typeof error, error);
    }
    
    // Log request context
    console.error('📝 Request Context:');
    console.error('  - URL:', request.url);
    console.error('  - Method:', request.method);
    try {
      const body = await request.clone().json();
      console.error('  - Body:', body);
    } catch (e) {
      console.error('  - Body parsing failed:', e);
    }
    
    return NextResponse.json(
      { 
        error: 'FREE AEC quantity takeoff failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : typeof error,
        usedFreeAPI: true
      },
      { status: 500 }
    );
  }
}

/**
 * Get existing takeoff results from storage
 */
async function getExistingTakeoff(
  designId: string, 
  projectId: string, 
  optionId: string
): Promise<AECQuantityTakeoffResult | null> {
  try {
    // In a real implementation, this would query your database
    // For now, we'll return null to always perform fresh takeoffs
    return null;
  } catch (error) {
    console.warn('⚠️ Failed to get existing takeoff:', error);
    return null;
  }
}

/**
 * Store takeoff results for future retrieval
 */
async function storeTakeoffResults(takeoffResult: AECQuantityTakeoffResult): Promise<void> {
  try {
    // In a real implementation, this would store to your database
    // For now, we'll just log the results
    console.log('💾 Storing FREE AEC takeoff results:', {
      designId: takeoffResult.designId,
      totalElements: takeoffResult.totalElements,
      materialsCount: takeoffResult.materials.length,
      totalVolume: takeoffResult.summary.totalVolume,
      usedFreeAPI: true
    });
    
    // TODO: Implement database storage
    // await database.quantityTakeoffs.create(takeoffResult);
    
  } catch (error) {
    console.error('❌ Failed to store takeoff results:', error);
    // Don't throw - we don't want to fail the entire operation
  }
}

/**
 * Get takeoff status for a model
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const designId = url.searchParams.get('designId');
    const projectId = url.searchParams.get('projectId');
    const optionId = url.searchParams.get('optionId');

    if (!designId || !projectId || !optionId) {
      return NextResponse.json(
        { error: 'Design ID, Project ID, and Option ID are required' },
        { status: 400 }
      );
    }

    const existingTakeoff = await getExistingTakeoff(designId, projectId, optionId);
    
    return NextResponse.json({
      success: true,
      hasExistingTakeoff: !!existingTakeoff,
      data: existingTakeoff,
      usedFreeAPI: true
    });

  } catch (error) {
    console.error('❌ Failed to get takeoff status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get takeoff status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}