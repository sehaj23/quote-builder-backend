import { Task, CreateTaskRequest, UpdateTaskRequest, TaskProgressSummary, TaskReminderStatus, TaskFilterOptions } from '../types/index.js';
export declare class TaskRepository {
    private getDbConnection;
    create(taskData: CreateTaskRequest): Promise<number>;
    findByQuoteId(quoteId: number, filters?: TaskFilterOptions): Promise<Task[]>;
    findById(taskId: number): Promise<Task | null>;
    update(taskId: number, taskData: UpdateTaskRequest): Promise<boolean>;
    delete(taskId: number): Promise<boolean>;
    getProgressSummary(quoteId: number): Promise<TaskProgressSummary>;
    findPendingReminders(channel?: 'whatsapp' | 'email', limit?: number): Promise<Task[]>;
    updateReminderState(taskId: number, status: TaskReminderStatus, nextReminderAt: Date | string | null, errorMessage?: string): Promise<boolean>;
}
//# sourceMappingURL=TaskRepository.d.ts.map