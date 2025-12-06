import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
import { ApiResponse } from '../types/index.js';

const PINPOINT_SHARED_SECRET = process.env.PINPOINT_WEBHOOK_SECRET || '';

export class WebhookController {
  constructor(private taskService: TaskService) {}

  private verifySecret(req: Request): boolean {
    if (!PINPOINT_SHARED_SECRET) return true; // allow if not configured
    const provided = req.headers['x-pinpoint-secret'] || req.query['secret'];
    return provided === PINPOINT_SHARED_SECRET;
  }

  async handlePinpointEvent(req: Request, res: Response) {
    try {
      if (!this.verifySecret(req)) {
        res.status(401).json({
          success: false,
          error: 'Invalid webhook secret'
        } as ApiResponse);
        return;
      }

      const payload = req.body;
      const events = Array.isArray(payload?.events) ? payload.events : [payload];

      for (const event of events) {
        await this.processPinpointEvent(event);
      }

      res.json({
        success: true,
        message: 'Webhook processed'
      } as ApiResponse);
    } catch (error) {
      console.error('Error handling Pinpoint webhook:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      } as ApiResponse);
    }
  }

  private async processPinpointEvent(event: any) {
    try {
      const messageType = event?.eventType || event?.['event-type'];
      if (messageType !== 'MESSAGE_RECEIVED') {
        return;
      }

      const attributes = event?.attributes || event?.['attributes'];
      const taskId = Number(
        attributes?.taskId ||
        attributes?.task_id ||
        event?.['taskId'] ||
        event?.['task_id']
      );

      if (!taskId) {
        console.warn('Pinpoint webhook missing taskId metadata, skipping');
        return;
      }

      const messageBody = event?.['messageBody'] ||
        event?.['message_body'] ||
        event?.['rawContent'] ||
        attributes?.messageBody ||
        '';

      const fromNumber = event?.['originationNumber'] ||
        event?.['from'] ||
        attributes?.from ||
        null;

      await this.taskService.recordIncomingReply(taskId, {
        message: messageBody,
        from: fromNumber,
        providerPayload: event
      });
    } catch (error) {
      console.error('Error processing Pinpoint event:', error);
    }
  }
}

