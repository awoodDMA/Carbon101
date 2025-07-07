import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook endpoint to handle BIM 360 / ACC model upload notifications
 * 
 * This endpoint receives notifications when new model versions are uploaded
 * and automatically triggers quantity takeoff processes.
 */

interface ModelUploadWebhookPayload {
  eventType: string;
  resourceUrn: string;
  projectId: string;
  versionId: string;
  modelName: string;
  timestamp: string;
  userId: string;
  uploadComplete: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity (in production, validate signature)
    const signature = request.headers.get('x-autodesk-signature');
    if (!signature) {
      console.warn('⚠️ Webhook received without signature');
    }

    const payload: ModelUploadWebhookPayload = await request.json();
    
    console.log('📥 Model upload webhook received:', {
      eventType: payload.eventType,
      projectId: payload.projectId,
      modelName: payload.modelName,
      versionId: payload.versionId
    });

    // Only process completed uploads
    if (!payload.uploadComplete) {
      console.log('⏳ Upload not complete, skipping quantity takeoff');
      return NextResponse.json({ 
        success: true, 
        message: 'Upload not complete, will process when finished' 
      });
    }

    // Filter for relevant event types
    const relevantEvents = [
      'version.created',
      'version.updated', 
      'model.uploaded',
      'translation.completed'
    ];

    if (!relevantEvents.includes(payload.eventType)) {
      console.log('ℹ️ Event type not relevant for quantity takeoff:', payload.eventType);
      return NextResponse.json({ 
        success: true, 
        message: 'Event type not relevant for quantity takeoff' 
      });
    }

    // Schedule quantity takeoff (with delay to ensure model is fully processed)
    await scheduleQuantityTakeoff({
      modelUrn: payload.resourceUrn,
      projectId: payload.projectId,
      versionId: payload.versionId,
      modelName: payload.modelName,
      delay: 5 * 60 * 1000 // 5 minutes delay
    });

    return NextResponse.json({
      success: true,
      message: 'Quantity takeoff scheduled successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Schedule a quantity takeoff to run after a delay
 */
async function scheduleQuantityTakeoff({
  modelUrn,
  projectId,
  versionId,
  modelName,
  delay = 0
}: {
  modelUrn: string;
  projectId: string;
  versionId: string;
  modelName: string;
  delay?: number;
}) {
  console.log(`⏰ Scheduling quantity takeoff for ${modelName} in ${delay/1000}s`);

  // In a production environment, you'd use a proper job queue like:
  // - Redis Bull Queue
  // - AWS SQS
  // - Google Cloud Tasks
  // - Azure Service Bus
  
  setTimeout(async () => {
    try {
      console.log('🚀 Starting scheduled quantity takeoff for:', modelName);
      
      // Call our FREE quantity takeoff API using AEC Data Model
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/quantity-takeoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designId: modelUrn, // Use as design ID for AEC Data Model
          projectId,
          optionId: 'webhook-auto', // Auto-generated option for webhook processing
          force: true // Force new takeoff for uploads
          // Note: This now uses FREE AEC Data Model API only
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scheduled quantity takeoff completed:', {
          modelName,
          totalElements: result.data?.totalElements,
          materialsCount: result.data?.materials?.length
        });

        // Notify relevant stakeholders
        await notifyTakeoffComplete({
          modelName,
          projectId,
          versionId,
          takeoffResult: result.data
        });

      } else {
        const error = await response.text();
        console.error('❌ Scheduled quantity takeoff failed:', error);
      }

    } catch (error) {
      console.error('❌ Scheduled quantity takeoff error:', error);
    }
  }, delay);
}

/**
 * Notify stakeholders that quantity takeoff is complete
 */
async function notifyTakeoffComplete({
  modelName,
  projectId,
  versionId,
  takeoffResult
}: {
  modelName: string;
  projectId: string;
  versionId: string;
  takeoffResult: any;
}) {
  try {
    console.log('📧 Notifying stakeholders of completed takeoff');

    // In a real implementation, you might:
    // - Send email notifications
    // - Update project dashboards
    // - Trigger carbon calculation workflows
    // - Post to team communication channels

    // For now, just log the notification
    console.log('📊 Quantity takeoff notification:', {
      modelName,
      projectId,
      versionId,
      summary: takeoffResult?.summary
    });

    // TODO: Implement actual notifications
    // await emailService.sendTakeoffNotification({ ... });
    // await slackService.postTakeoffUpdate({ ... });
    // await updateProjectDashboard({ ... });

  } catch (error) {
    console.error('❌ Failed to send takeoff notifications:', error);
  }
}

/**
 * Webhook verification (for production use)
 */
function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  // In production, implement proper signature verification
  // using HMAC-SHA256 or similar
  return true;
}

/**
 * GET endpoint to check webhook status
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Model upload webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}