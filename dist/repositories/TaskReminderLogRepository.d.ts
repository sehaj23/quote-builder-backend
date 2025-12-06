import { CreateTaskReminderLogRequest, TaskReminderLog } from '../types/index.js';
export declare class TaskReminderLogRepository {
    private getDbConnection;
    create(log: CreateTaskReminderLogRequest): Promise<number>;
    findByTaskId(taskId: number, limit?: number): Promise<TaskReminderLog[]>;
}
//# sourceMappingURL=TaskReminderLogRepository.d.ts.map