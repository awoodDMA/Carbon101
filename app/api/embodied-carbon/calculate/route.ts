import { NextRequest, NextResponse } from 'next/server';
import { QuantityTakeoffResult } from '@/lib/quantity-takeoff';
import EmbodiedCarbonCalculator, { EmbodiedCarbonResult } from '@/lib/embodied-carbon-calculator';

/**
 * API endpoint to calculate embodied carbon from quantity takeoff results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      takeoffResult, 
      projectId, 
      optionId, 
      buildingArea 
    }: {
      takeoffResult: QuantityTakeoffResult;
      projectId: string;
      optionId: string;
      buildingArea?: number;
    } = body;

    if (!takeoffResult) {
      return NextResponse.json(
        { error: 'Quantity takeoff result is required' },
        { status: 400 }
      );
    }

    if (!projectId || !optionId) {
      return NextResponse.json(
        { error: 'Project ID and Option ID are required' },
        { status: 400 }
      );
    }

    console.log('🧮 Starting embodied carbon calculation:', {
      projectId,
      optionId,
      materials: takeoffResult.materials.length,
      totalElements: takeoffResult.totalElements
    });

    // Initialize calculator
    const calculator = new EmbodiedCarbonCalculator();

    // Calculate embodied carbon
    const carbonResult = await calculator.calculateEmbodiedCarbon(
      takeoffResult,
      projectId,
      optionId,
      buildingArea
    );

    // Store results (in a real implementation, save to database)
    await storeEmbodiedCarbonResults(carbonResult);

    console.log('✅ Embodied carbon calculation completed:', {
      totalCarbon: carbonResult.totalCarbonTonnes.toFixed(2) + ' tonnes CO2e',
      dataQuality: carbonResult.dataQuality
    });

    return NextResponse.json({
      success: true,
      data: carbonResult
    });

  } catch (error) {
    console.error('❌ Embodied carbon calculation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Embodied carbon calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get existing embodied carbon calculation
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const optionId = url.searchParams.get('optionId');
    const modelUrn = url.searchParams.get('modelUrn');

    if (!projectId || !optionId) {
      return NextResponse.json(
        { error: 'Project ID and Option ID are required' },
        { status: 400 }
      );
    }

    // In a real implementation, query the database
    const existingCalculation = await getExistingCalculation(projectId, optionId, modelUrn);

    return NextResponse.json({
      success: true,
      hasExistingCalculation: !!existingCalculation,
      data: existingCalculation
    });

  } catch (error) {
    console.error('❌ Failed to get embodied carbon calculation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get embodied carbon calculation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Store embodied carbon results
 */
async function storeEmbodiedCarbonResults(carbonResult: EmbodiedCarbonResult): Promise<void> {
  try {
    console.log('💾 Storing embodied carbon results:', {
      projectId: carbonResult.projectId,
      optionId: carbonResult.optionId,
      totalCarbon: carbonResult.totalCarbonTonnes,
      materialsCount: carbonResult.materials.length
    });

    // In a real implementation, this would store to database:
    // await database.embodiedCarbonCalculations.create({
    //   project_id: carbonResult.projectId,
    //   option_id: carbonResult.optionId,
    //   model_urn: carbonResult.modelUrn,
    //   total_carbon: carbonResult.totalCarbon,
    //   calculation_date: carbonResult.calculationDate,
    //   calculation_method: carbonResult.methodology,
    //   carbon_breakdown: carbonResult.summary,
    //   assumptions: carbonResult.assumptions,
    //   raw_data: carbonResult
    // });

  } catch (error) {
    console.error('❌ Failed to store embodied carbon results:', error);
    // Don't throw - we don't want to fail the entire calculation
  }
}

/**
 * Get existing calculation from storage
 */
async function getExistingCalculation(
  projectId: string,
  optionId: string,
  modelUrn?: string | null
): Promise<EmbodiedCarbonResult | null> {
  try {
    // In a real implementation, this would query the database
    // const calculation = await database.embodiedCarbonCalculations.findFirst({
    //   where: {
    //     project_id: projectId,
    //     option_id: optionId,
    //     ...(modelUrn && { model_urn: modelUrn })
    //   },
    //   orderBy: { created_at: 'desc' }
    // });
    
    // return calculation?.raw_data || null;
    
    return null; // For now, always return null to force fresh calculations
    
  } catch (error) {
    console.warn('⚠️ Failed to get existing calculation:', error);
    return null;
  }
}