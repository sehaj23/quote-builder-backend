import { randomUUID } from 'crypto';
export class TaskController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    async listTasks(req, res) {
        try {
            const quoteId = parseInt(req.params.quoteId || '');
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid quote ID is required'
                });
                return;
            }
            const getQueryParam = (value) => {
                if (typeof value === 'string') {
                    return value;
                }
                if (Array.isArray(value) && value.length > 0) {
                    return typeof value[0] === 'string' ? value[0] : undefined;
                }
                return undefined;
            };
            const status = req.query.status;
            const priority = req.query.priority;
            const searchParam = getQueryParam(req.query.search);
            const search = searchParam?.trim();
            const overdueOnlyParam = getQueryParam(req.query.overdueOnly);
            const overdueOnly = overdueOnlyParam
                ? ['true', '1', 'yes'].includes(overdueOnlyParam.toLowerCase())
                : false;
            const filters = {};
            if (status) {
                filters.status = status;
            }
            if (priority) {
                filters.priority = priority;
            }
            if (search) {
                filters.search = search;
            }
            if (overdueOnly) {
                filters.overdueOnly = true;
            }
            const tasks = await this.taskService.getTasksByQuote(quoteId, filters);
            res.json({
                success: true,
                data: tasks,
                message: `Found ${tasks.length} tasks for quote ${quoteId}`
            });
        }
        catch (error) {
            console.error('Error in TaskController.listTasks:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list tasks'
            });
        }
    }
    async createTask(req, res) {
        try {
            const quoteId = parseInt(req.params.quoteId || '');
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid quote ID is required'
                });
                return;
            }
            const body = req.body;
            const companyId = body.company_id ?? body.companyId ?? req.user?.company_id;
            if (!companyId || isNaN(Number(companyId))) {
                res.status(400).json({
                    success: false,
                    error: 'company_id is required to create a task'
                });
                return;
            }
            const taskPayload = {
                title: body.title || '',
                status: body.status ?? 'pending',
                priority: body.priority ?? 'medium'
            };
            if (body.description !== undefined)
                taskPayload.description = body.description;
            if (body.due_at !== undefined)
                taskPayload.due_at = body.due_at;
            if (body.assigned_to !== undefined)
                taskPayload.assigned_to = body.assigned_to;
            if (body.assigned_phone !== undefined)
                taskPayload.assigned_phone = body.assigned_phone;
            if (body.reminder_enabled !== undefined)
                taskPayload.reminder_enabled = body.reminder_enabled;
            if (body.reminder_channel !== undefined)
                taskPayload.reminder_channel = body.reminder_channel;
            if (body.reminder_frequency !== undefined)
                taskPayload.reminder_frequency = body.reminder_frequency;
            if (body.next_reminder_at !== undefined)
                taskPayload.next_reminder_at = body.next_reminder_at;
            if (body.created_by !== undefined || req.user?.id) {
                taskPayload.created_by = req.user?.id || body.created_by;
            }
            const task = await this.taskService.createTask(quoteId, Number(companyId), taskPayload);
            res.status(201).json({
                success: true,
                data: task,
                message: 'Task created successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.createTask:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create task'
            });
        }
    }
    async getTaskById(req, res) {
        try {
            const taskId = parseInt(req.params.taskId || '');
            if (isNaN(taskId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid task ID is required'
                });
                return;
            }
            const task = await this.taskService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
                return;
            }
            res.json({
                success: true,
                data: task,
                message: 'Task retrieved successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.getTaskById:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve task'
            });
        }
    }
    async updateTask(req, res) {
        try {
            const taskId = parseInt(req.params.taskId || '');
            if (isNaN(taskId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid task ID is required'
                });
                return;
            }
            const payload = req.body;
            const updated = await this.taskService.updateTask(taskId, payload);
            if (!updated) {
                res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
                return;
            }
            res.json({
                success: true,
                data: updated,
                message: 'Task updated successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.updateTask:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update task'
            });
        }
    }
    async deleteTask(req, res) {
        try {
            const taskId = parseInt(req.params.taskId || '');
            if (isNaN(taskId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid task ID is required'
                });
                return;
            }
            const deleted = await this.taskService.deleteTask(taskId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
                return;
            }
            res.json({
                success: true,
                data: null,
                message: 'Task deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.deleteTask:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete task'
            });
        }
    }
    async getQuoteTaskSummary(req, res) {
        try {
            const quoteId = parseInt(req.params.quoteId || '');
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid quote ID is required'
                });
                return;
            }
            const summary = await this.taskService.getQuoteTaskProgress(quoteId);
            res.json({
                success: true,
                data: summary,
                message: 'Task summary retrieved successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.getQuoteTaskSummary:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve task summary'
            });
        }
    }
    async triggerReminder(req, res) {
        try {
            const taskId = parseInt(req.params.taskId || '');
            if (isNaN(taskId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid task ID is required'
                });
                return;
            }
            await this.taskService.scheduleTaskReminder(taskId);
            res.json({
                success: true,
                data: { id: taskId },
                message: 'Reminder scheduled successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.triggerReminder:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to schedule reminder'
            });
        }
    }
    async listReminderLogs(req, res) {
        try {
            const taskId = parseInt(req.params.taskId || '');
            if (isNaN(taskId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid task ID is required'
                });
                return;
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const logs = await this.taskService.getReminderLogs(taskId, limit);
            res.json({
                success: true,
                data: logs,
                message: 'Reminder logs retrieved successfully'
            });
        }
        catch (error) {
            console.error('Error in TaskController.listReminderLogs:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve reminder logs'
            });
        }
    }
    async runReminderJob(req, res) {
        const channel = req.query.channel || 'whatsapp';
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const jobId = randomUUID();
        setImmediate(async () => {
            try {
                const result = await this.taskService.processPendingReminders(channel, limit);
                console.log(`[ReminderJob ${jobId}] Processed ${result.processed} ${channel} reminders`);
            }
            catch (error) {
                console.error(`[ReminderJob ${jobId}] Failed:`, error);
            }
        });
        res.status(202).json({
            success: true,
            data: { jobId, channel, limit },
            message: 'Reminder job accepted'
        });
    }
}
//# sourceMappingURL=TaskController.js.map