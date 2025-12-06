import { Task, CreateTaskRequest, UpdateTaskRequest, TaskProgressSummary, TaskReminderLog, TaskFilterOptions } from '../types/index.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { TaskReminderLogRepository } from '../repositories/TaskReminderLogRepository.js';
export declare class TaskService {
    private taskRepository;
    private reminderLogRepository?;
    constructor(taskRepository: TaskRepository, reminderLogRepository?: TaskReminderLogRepository | undefined);
    getTasksByQuote(quoteId: number, filters?: TaskFilterOptions): Promise<Task[]>;
    getTaskById(taskId: number): Promise<Task | null>;
    createTask(quoteId: number, companyId: number, payload: Omit<CreateTaskRequest, 'quote_id' | 'company_id'>): Promise<Task>;
    updateTask(taskId: number, payload: UpdateTaskRequest): Promise<Task | null>;
    deleteTask(taskId: number): Promise<boolean>;
    getReminderLogs(taskId: number, limit?: number): Promise<TaskReminderLog[]>;
    getQuoteTaskProgress(quoteId: number): Promise<TaskProgressSummary>;
    processPendingReminders(channel?: 'whatsapp' | 'email', limit?: number): Promise<{
        channel: string;
        processed: number;
    }>;
    scheduleTaskReminder(taskId: number): Promise<void>;
    recordIncomingReply(taskId: number, options: {
        message: string;
        from?: string | null;
        providerPayload?: any;
    }): Promise<void>;
    private prepareReminderOptions;
    private calculateNextReminder;
    private sendWhatsappReminder;
    private buildWhatsappMessage;
    private logReminder;
}
//# sourceMappingURL=TaskService.d.ts.map