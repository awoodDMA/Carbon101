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

    // Get access token for Autodesk APS
    const tokenData = await getAccessToken(request);
    if (!tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 401 }
      );
    }

    // Check if takeoff already exists (unless forced)
    if (!force) {
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
    }

    // Perform quantity takeoff using FREE AEC Data Model API
    const takeoffResult = await aecQuantityTakeoffService.performQuantityTakeoff(
      designId,
      projectId
    );

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
    
    return NextResponse.json(
      { 
        error: 'FREE AEC quantity takeoff failed',
        details: error instanceof Error ? error.message : 'Unknown error',
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