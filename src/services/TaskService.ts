import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskProgressSummary,
  TaskReminderFrequency,
  TaskReminderStatus,
  TaskReminderLog,
  TaskFilterOptions
} from '../types/index.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { TaskReminderLogRepository } from '../repositories/TaskReminderLogRepository.js';

interface ReminderOptions {
  reminder_enabled?: boolean | undefined;
  reminder_frequency?: TaskReminderFrequency | undefined;
  due_at?: Date | string | null | undefined;
  next_reminder_at?: Date | string | null | undefined;
}

export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private reminderLogRepository?: TaskReminderLogRepository
  ) {}

  async getTasksByQuote(quoteId: number, filters: TaskFilterOptions = {}): Promise<Task[]> {
    if (!quoteId || quoteId <= 0) {
      throw new Error('Valid quote ID is required');
    }
    return this.taskRepository.findByQuoteId(quoteId, filters);
  }

  async getTaskById(taskId: number): Promise<Task | null> {
    if (!taskId || taskId <= 0) {
      throw new Error('Valid task ID is required');
    }
    return this.taskRepository.findById(taskId);
  }

  async createTask(
    quoteId: number,
    companyId: number,
    payload: Omit<CreateTaskRequest, 'quote_id' | 'company_id'>
  ): Promise<Task> {
    if (!quoteId || quoteId <= 0) {
      throw new Error('Valid quote ID is required');
    }
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Task title is required');
    }

    const reminderOptions: ReminderOptions = {
      reminder_enabled: payload.reminder_enabled ?? false,
      due_at: payload.due_at,
      next_reminder_at: payload.next_reminder_at
    };
    if (payload.reminder_frequency !== undefined) {
      reminderOptions.reminder_frequency = payload.reminder_frequency;
    }
    const reminderFields = this.prepareReminderOptions(reminderOptions);
    const insertId = await this.taskRepository.create({
      ...payload,
      ...reminderFields,
      quote_id: quoteId,
      company_id: companyId,
      status: payload.status || 'pending',
      priority: payload.priority || 'medium'
    });

    const created = await this.taskRepository.findById(insertId);
    if (!created) {
      throw new Error('Failed to retrieve created task');
    }
    return created;
  }

  async updateTask(taskId: number, payload: UpdateTaskRequest): Promise<Task | null> {
    if (!taskId || taskId <= 0) {
      throw new Error('Valid task ID is required');
    }

    const existing = await this.taskRepository.findById(taskId);
    if (!existing) {
      return null;
    }

    const reminderEnabled = (payload.reminder_enabled ?? existing.reminder_enabled) ?? false;
    const reminderOptions: ReminderOptions = {
      reminder_enabled: reminderEnabled,
      due_at: payload.due_at ?? existing.due_at,
      next_reminder_at: payload.next_reminder_at ?? existing.next_reminder_at
    };
    if (payload.reminder_frequency !== undefined) {
      reminderOptions.reminder_frequency = payload.reminder_frequency;
    } else if (existing.reminder_frequency) {
      reminderOptions.reminder_frequency = existing.reminder_frequency;
    }
    const reminderFields = this.prepareReminderOptions(reminderOptions);

    await this.taskRepository.update(taskId, {
      ...payload,
      ...reminderFields
    });

    return this.taskRepository.findById(taskId);
  }

  async deleteTask(taskId: number): Promise<boolean> {
    if (!taskId || taskId <= 0) {
      throw new Error('Valid task ID is required');
    }
    return this.taskRepository.delete(taskId);
  }

  async getReminderLogs(taskId: number, limit = 50): Promise<TaskReminderLog[]> {
    if (!taskId || taskId <= 0) {
      throw new Error('Valid task ID is required');
    }
    if (!this.reminderLogRepository) {
      return [];
    }
    return this.reminderLogRepository.findByTaskId(taskId, limit);
  }

  async getQuoteTaskProgress(quoteId: number): Promise<TaskProgressSummary> {
    if (!quoteId || quoteId <= 0) {
      throw new Error('Valid quote ID is required');
    }
    return this.taskRepository.getProgressSummary(quoteId);
  }

  async processPendingReminders(channel: 'whatsapp' | 'email' = 'whatsapp', limit = 100): Promise<{ channel: string; processed: number; }> {
    const tasks = await this.taskRepository.findPendingReminders(channel, limit);
    let processed = 0;
    for (const task of tasks) {
      try {
        await this.sendWhatsappReminder(task);
        const nextReminder = this.calculateNextReminder(task);
        await this.taskRepository.updateReminderState(task.id!, nextReminder ? 'pending' : 'sent', nextReminder);
        processed++;
      } catch (error) {
        await this.logReminder(task, 'failed', this.buildWhatsappMessage(task), error);
        await this.taskRepository.updateReminderState(
          task.id!,
          'failed',
          task.next_reminder_at || null,
          error instanceof Error ? error.message : 'Unknown reminder error'
        );
      }
    }
    return { channel, processed };
  }

  async scheduleTaskReminder(taskId: number): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (!task.reminder_enabled) {
      throw new Error('Reminders are disabled for this task');
    }
    await this.sendWhatsappReminder(task);
    const nextReminder = this.calculateNextReminder(task);
    await this.taskRepository.updateReminderState(task.id!, nextReminder ? 'pending' : 'sent', nextReminder);
  }

  async recordIncomingReply(
    taskId: number,
    options: { message: string; from?: string | null; providerPayload?: any }
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found for incoming reply');
    }

    const normalizedMessage = options.message?.trim().toLowerCase() || '';
    let newStatus: Task['status'] | undefined;
    if (normalizedMessage.includes('done') || normalizedMessage.includes('complete')) {
      newStatus = 'completed';
    } else if (normalizedMessage.includes('progress') || normalizedMessage.includes('working')) {
      newStatus = 'in_progress';
    } else if (normalizedMessage.includes('blocked')) {
      newStatus = 'blocked';
    }

    await this.logReminder(task, 'pending', options.message, undefined, 'inbound', options.from, options.providerPayload);

    if (newStatus && newStatus !== task.status) {
      await this.taskRepository.update(taskId, { status: newStatus });
    }
  }

  private prepareReminderOptions(options: ReminderOptions) {
    if (!options.reminder_enabled) {
      return {
        reminder_enabled: false,
        next_reminder_at: null,
        reminder_status: 'pending' as TaskReminderStatus,
        reminder_error: null
      };
    }

    const nextReminder = this.calculateNextReminder({
      reminder_enabled: options.reminder_enabled,
      reminder_frequency: options.reminder_frequency,
      due_at: options.due_at,
      next_reminder_at: options.next_reminder_at
    } as Task);

    return {
      reminder_enabled: true,
      reminder_status: 'pending' as TaskReminderStatus,
      reminder_error: null,
      reminder_frequency: options.reminder_frequency || 'once',
      next_reminder_at: nextReminder
    };
  }

  private calculateNextReminder(task: Task | ReminderOptions): Date | string | null {
    if (!task.reminder_enabled) {
      return null;
    }

    const frequency = task.reminder_frequency || 'once';
    const due = task.due_at ? new Date(task.due_at) : null;
    const now = new Date();

    if (frequency === 'before_due' && due) {
      const reminderDate = new Date(due);
      reminderDate.setHours(reminderDate.getHours() - 24);
      return reminderDate > now ? reminderDate : now;
    }

    if (frequency === 'daily') {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (frequency === 'weekly') {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      return next;
    }

    // 'once' or fallback
    if (task.next_reminder_at) {
      return task.next_reminder_at;
    }

    if (due && due > now) {
      const reminderDate = new Date(due);
      reminderDate.setHours(reminderDate.getHours() - 24);
      return reminderDate > now ? reminderDate : now;
    }

    return now;
  }

  // Placeholder for future WhatsApp integration
  private async sendWhatsappReminder(task: Task): Promise<void> {
    const message = this.buildWhatsappMessage(task);
    try {
      console.log(`[Reminder] WhatsApp reminder queued for task #${task.id}: ${message}`);
      await this.logReminder(task, 'sent', message);
      // Future implementation will call a provider (Twilio/Meta) here.
    } catch (error) {
      await this.logReminder(task, 'failed', message, error);
      throw error;
    }
  }

  private buildWhatsappMessage(task: Task): string {
    const dueText = task.due_at ? `Due: ${new Date(task.due_at).toLocaleString()}` : 'Due date not set';
    return `Task "${task.title}" for Quote #${task.quote_id}. ${dueText}. Status: ${task.status}`;
  }

  private async logReminder(
    task: Task,
    status: TaskReminderStatus,
    message: string,
    error?: unknown,
    direction: 'outbound' | 'inbound' = 'outbound',
    replyFrom?: string | null,
    providerPayload?: any
  ): Promise<void> {
    if (!this.reminderLogRepository || !task.id) {
      return;
    }

    await this.reminderLogRepository.create({
      task_id: task.id,
      channel: 'whatsapp',
      status,
      message_body: message,
      error_message: error instanceof Error ? error.message : null,
      metadata: {
        quote_id: task.quote_id,
        company_id: task.company_id,
        assigned_to: task.assigned_to,
        assigned_phone: task.assigned_phone,
        provider_payload: providerPayload
      },
      direction,
      reply_from: replyFrom || null,
      sent_at: new Date()
    });
  }
}

