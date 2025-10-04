import { Request, Response } from 'express';
import { ActivityService } from '../services/ActivityService.js';
export declare class ActivityController {
    private activityService;
    constructor(activityService: ActivityService);
    getActivities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserActivities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getCompanyActivities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logActivity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ActivityController.d.ts.map