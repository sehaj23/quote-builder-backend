import { Request, Response } from 'express';
import { SuperUserService } from '../services/SuperUserService.js';
import { ActivityService } from '../services/ActivityService.js';
export declare class SuperUserController {
    private superUserService;
    private activityService;
    constructor(superUserService: SuperUserService, activityService: ActivityService);
    getUsersByCompany(req: Request, res: Response): Promise<Response>;
    createUserForCompany(req: Request, res: Response): Promise<Response>;
    updateUserInCompany(req: Request, res: Response): Promise<Response>;
    removeUserFromCompany(req: Request, res: Response): Promise<Response>;
    getUserById(req: Request, res: Response): Promise<Response>;
    getAllUsers(_req: Request, res: Response): Promise<Response>;
    getUserStats(_req: Request, res: Response): Promise<Response>;
    getCompanyUserStats(req: Request, res: Response): Promise<Response>;
    getCompanyUsersActivity(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=SuperUserController.d.ts.map