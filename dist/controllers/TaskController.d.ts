import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
export declare class TaskController {
    private taskService;
    constructor(taskService: TaskService);
    listTasks(req: Request, res: Response): Promise<void>;
    createTask(req: Request, res: Response): Promise<void>;
    getTaskById(req: Request, res: Response): Promise<void>;
    updateTask(req: Request, res: Response): Promise<void>;
    deleteTask(req: Request, res: Response): Promise<void>;
    getQuoteTaskSummary(req: Request, res: Response): Promise<void>;
    triggerReminder(req: Request, res: Response): Promise<void>;
    listReminderLogs(req: Request, res: Response): Promise<void>;
    runReminderJob(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=TaskController.d.ts.map