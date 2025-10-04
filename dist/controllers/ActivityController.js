import { validationResult } from 'express-validator';
export class ActivityController {
    activityService;
    constructor(activityService) {
        this.activityService = activityService;
    }
    async getActivities(req, res) {
        try {
            const { companyId } = req.params;
            const { userId, action, limit = 50, offset = 0 } = req.query;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset)
            };
            if (companyId) {
                options.companyId = parseInt(companyId);
            }
            if (userId) {
                options.userId = userId;
            }
            if (action) {
                options.action = action;
            }
            const activities = await this.activityService.getActivities(options);
            const response = {
                success: true,
                data: activities,
                message: 'Activities retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getActivityById(req, res) {
        try {
            const { activityId } = req.params;
            const activity = await this.activityService.getActivityById(parseInt(activityId || ''));
            if (!activity) {
                const response = {
                    success: false,
                    error: 'Activity not found'
                };
                return res.status(404).json(response);
            }
            const response = {
                success: true,
                data: activity,
                message: 'Activity retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getUserActivities(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset)
            };
            if (userId) {
                options.userId = userId;
            }
            const activities = await this.activityService.getActivities(options);
            const response = {
                success: true,
                data: activities,
                message: 'User activities retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getCompanyActivities(req, res) {
        try {
            const { companyId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const activities = await this.activityService.getActivities({
                companyId: parseInt(companyId || ''),
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            const response = {
                success: true,
                data: activities,
                message: 'Company activities retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async logActivity(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const response = {
                    success: false,
                    error: 'Validation failed',
                    data: errors.array()
                };
                return res.status(400).json(response);
            }
            const activityData = {
                ...req.body,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            };
            const activity = await this.activityService.logActivity(activityData);
            const response = {
                success: true,
                data: activity,
                message: 'Activity logged successfully'
            };
            return res.status(201).json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getActivityStats(req, res) {
        try {
            const { companyId } = req.params;
            const stats = await this.activityService.getActivityStats(companyId ? parseInt(companyId) : undefined);
            const response = {
                success: true,
                data: stats,
                message: 'Activity stats retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
}
//# sourceMappingURL=ActivityController.js.map