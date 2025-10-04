import { Request, Response } from 'express';
import { ActivityService } from '../services/ActivityService.js';
import { ApiResponse, CreateActivityRequest } from '../types/index.js';
import { validationResult } from 'express-validator';

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  async getActivities(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { userId, action, limit = 50, offset = 0 } = req.query;
      
      const options: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      if (companyId) {
        options.companyId = parseInt(companyId as string);
      }
      if (userId) {
        options.userId = userId as string;
      }
      if (action) {
        options.action = action as string;
      }
      
      const activities = await this.activityService.getActivities(options);

      const response: ApiResponse = {
        success: true,
        data: activities,
        message: 'Activities retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getActivityById(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const activity = await this.activityService.getActivityById(parseInt(activityId || ''));
      
      if (!activity) {
        const response: ApiResponse = {
          success: false,
          error: 'Activity not found'
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: activity,
        message: 'Activity retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getUserActivities(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const options: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      if (userId) {
        options.userId = userId;
      }
      
      const activities = await this.activityService.getActivities(options);

      const response: ApiResponse = {
        success: true,
        data: activities,
        message: 'User activities retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getCompanyActivities(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const activities = await this.activityService.getActivities({
        companyId: parseInt(companyId || ''),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      const response: ApiResponse = {
        success: true,
        data: activities,
        message: 'Company activities retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async logActivity(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array()
        };
        return res.status(400).json(response);
      }

      const activityData: CreateActivityRequest = {
        ...req.body,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      };
      
      const activity = await this.activityService.logActivity(activityData);

      const response: ApiResponse = {
        success: true,
        data: activity,
        message: 'Activity logged successfully'
      };
      return res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getActivityStats(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const stats = await this.activityService.getActivityStats(
        companyId ? parseInt(companyId) : undefined
      );

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Activity stats retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }
}