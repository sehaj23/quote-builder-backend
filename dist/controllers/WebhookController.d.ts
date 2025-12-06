import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
export declare class WebhookController {
    private taskService;
    constructor(taskService: TaskService);
    private verifySecret;
    handlePinpointEvent(req: Request, res: Response): Promise<void>;
    private processPinpointEvent;
}
//# sourceMappingURL=WebhookController.d.ts.map