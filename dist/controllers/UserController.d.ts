import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';
import { ActivityService } from '../services/ActivityService.js';
import { CompanyService } from '../services/CompanyService.js';
export declare class UserController {
    private userService;
    private activityService;
    private companyService;
    constructor(userService: UserService, activityService: ActivityService, companyService: CompanyService);
    getUserDetailsWithCompany(req: Request, res: Response): Promise<Response>;
    getAllUsers(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    approveUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getPendingUsers(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateLastActivity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=UserController.d.ts.map