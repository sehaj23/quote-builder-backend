import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { TaskService } from '../services/TaskService.js';
import { ActivityService } from '../services/ActivityService.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import {
  ApiResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
  TaskFilterOptions,
  Task
} from '../types/index.js';

export class TaskController {
  private activityService: ActivityService;

  constructor(private taskService: TaskService, activityService?: ActivityService) {
    this.activityService = activityService || new ActivityService(new ActivityRepository());
  }

  private async logTaskActivity(
    req: Request,
    action: 'task_created' | 'task_updated' | 'task_deleted',
    task: Partial<Task> | null,
    description?: string
  ): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      if (!userId) {
        return;
      }
      await this.activityService.logActivity({
        user_id: userId,
        company_id: task?.company_id,
        action,
        resource_type: 'task',
        resource_id: task?.id,
        description,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || undefined
      });
    } catch (error) {
      console.warn(`Activity logging failed (${action}):`, error);
    }
  }

  async listTasks(req: Request, res: Response) {
    try {
      const quoteId = parseInt(req.params.quoteId || '');
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Valid quote ID is required'
        } as ApiResponse);
        return;
      }

      const getQueryParam = (value: unknown): string | undefined => {
        if (typeof value === 'string') {
          return value;
        }
        if (Array.isArray(value) && value.length > 0) {
          return typeof value[0] === 'string' ? value[0] : undefined;
        }
        return undefined;
      };

      const status = req.query.status as TaskStatus | undefined;
      const priority = req.query.priority as TaskPriority | undefined;
      const searchParam = getQueryParam(req.query.search);
      const search = searchParam?.trim();
      const overdueOnlyParam = getQueryParam(req.query.overdueOnly);
      const overdueOnly = overdueOnlyParam
        ? ['true', '1', 'yes'].includes(overdueOnlyParam.toLowerCase())
        : false;

      const filters: TaskFilterOptions = {};
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
      } as ApiResponse);
    } catch (error) {
      console.error('Error in TaskController.listTasks:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tasks'
      } as ApiResponse);
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const quoteId = parseInt(req.params.quoteId || '');
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Valid quote ID is required'
        } as ApiResponse);
        return;
      }

      const body = req.body as Partial<CreateTaskRequest> & { companyId?: number };
      const companyId = body.company_id ?? body.companyId ?? (req as any).user?.company_id;
      if (!companyId || isNaN(Number(companyId))) {
        res.status(400).json({
          success: false,
          error: 'company_id is required to create a task'
        } as ApiResponse);
        return;
      }

      const taskPayload: Omit<CreateTaskRequest, 'quote_id' | 'company_id'> = {
        title: body.title || '',
        status: body.status ?? 'pending',
        priority: body.priority ?? 'medium'
      };

      if (body.description !== undefined) taskPayload.description = body.description;
      if (body.due_at !== undefined) taskPayload.due_at = body.due_at;
      if (body.assigned_to !== undefined) taskPayload.assigned_to = body.assigned_to;
      if (body.assigned_phone !== undefined) taskPayload.assigned_phone = body.assigned_phone;
      if (body.reminder_enabled !== undefined) taskPayload.reminder_enabled = body.reminder_enabled;
      if (body.reminder_channel !== undefined) taskPayload.reminder_channel = body.reminder_channel;
      if (body.reminder_frequency !== undefined) taskPayload.reminder_frequency = body.reminder_frequency;
      if (body.next_reminder_at !== undefined) taskPayload.next_reminder_at = body.next_reminder_at;
      if (body.created_by !== undefined || (req as any).user?.id) {
        taskPayload.created_by = (req as any).user?.id || body.created_by;
      }

      const task = await this.taskService.createTask(
        quoteId,
        Number(companyId),
        taskPayload
      );

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      } as ApiResponse);

      const description = `Created task "${task.title}" for quote ${task.quote_id}`;
      void this.logTaskActivity(req, 'task_created', task, description);
    } catch (error) {
      console.error('Error in TaskController.createTask:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task'
      } as ApiResponse);
    }
  }

  async getTaskById(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId || '');
      if (isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Valid task ID is required'
        } as ApiResponse);
        return;
      }

      const task = await this.taskService.getTaskById(taskId);
      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: task,
        message: 'Task retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in TaskController.getTaskById:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve task'
      } as ApiResponse);
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId || '');
      if (isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Valid task ID is required'
        } as ApiResponse);
        return;
      }

      const payload = req.body as UpdateTaskRequest;
      const updated = await this.taskService.updateTask(taskId, payload);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: updated,
        message: 'Task updated successfully'
      } as ApiResponse);

      const description = `Updated task "${updated.title}" (status: ${updated.status})`;
      void this.logTaskActivity(req, 'task_updated', updated, description);
    } catch (error) {
      console.error('Error in TaskController.updateTask:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      } as ApiResponse);
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId || '');
      if (isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Valid task ID is required'
        } as ApiResponse);
        return;
      }

      const existing = await this.taskService.getTaskById(taskId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        } as ApiResponse);
        return;
      }

      const deleted = await this.taskService.deleteTask(taskId);
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'Failed to delete task'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: null,
        message: 'Task deleted successfully'
      } as ApiResponse);

      const description = `Deleted task "${existing.title}" (ID ${existing.id})`;
      void this.logTaskActivity(req, 'task_deleted', existing, description);
    } catch (error) {
      console.error('Error in TaskController.deleteTask:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      } as ApiResponse);
    }
  }

  async getQuoteTaskSummary(req: Request, res: Response) {
    try {
      const quoteId = parseInt(req.params.quoteId || '');
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Valid quote ID is required'
        } as ApiResponse);
        return;
      }

      const summary = await this.taskService.getQuoteTaskProgress(quoteId);
      res.json({
        success: true,
        data: summary,
        message: 'Task summary retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in TaskController.getQuoteTaskSummary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve task summary'
      } as ApiResponse);
    }
  }

  async triggerReminder(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId || '');
      if (isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Valid task ID is required'
        } as ApiResponse);
        return;
      }

      await this.taskService.scheduleTaskReminder(taskId);
      res.json({
        success: true,
        data: { id: taskId },
        message: 'Reminder scheduled successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in TaskController.triggerReminder:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule reminder'
      } as ApiResponse);
    }
  }

  async listReminderLogs(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId || '');
      if (isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Valid task ID is required'
        } as ApiResponse);
        return;
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await this.taskService.getReminderLogs(taskId, limit);
      res.json({
        success: true,
        data: logs,
        message: 'Reminder logs retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in TaskController.listReminderLogs:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve reminder logs'
      } as ApiResponse);
    }
  }

  async runReminderJob(req: Request, res: Response) {
    const channel = (req.query.channel as 'whatsapp' | 'email') || 'whatsapp';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const jobId = randomUUID();

    setImmediate(async () => {
      try {
        const result = await this.taskService.processPendingReminders(channel, limit);
        console.log(`[ReminderJob ${jobId}] Processed ${result.processed} ${channel} reminders`);
      } catch (error) {
        console.error(`[ReminderJob ${jobId}] Failed:`, error);
      }
    });

    res.status(202).json({
      success: true,
      data: { jobId, channel, limit },
      message: 'Reminder job accepted'
    } as ApiResponse);
  }
}

