export class TaskService {
    taskRepository;
    reminderLogRepository;
    constructor(taskRepository, reminderLogRepository) {
        this.taskRepository = taskRepository;
        this.reminderLogRepository = reminderLogRepository;
    }
    async getTasksByQuote(quoteId, filters = {}) {
        if (!quoteId || quoteId <= 0) {
            throw new Error('Valid quote ID is required');
        }
        return this.taskRepository.findByQuoteId(quoteId, filters);
    }
    async getTaskById(taskId) {
        if (!taskId || taskId <= 0) {
            throw new Error('Valid task ID is required');
        }
        return this.taskRepository.findById(taskId);
    }
    async createTask(quoteId, companyId, payload) {
        if (!quoteId || quoteId <= 0) {
            throw new Error('Valid quote ID is required');
        }
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!payload.title || !payload.title.trim()) {
            throw new Error('Task title is required');
        }
        const reminderOptions = {
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
    async updateTask(taskId, payload) {
        if (!taskId || taskId <= 0) {
            throw new Error('Valid task ID is required');
        }
        const existing = await this.taskRepository.findById(taskId);
        if (!existing) {
            return null;
        }
        const reminderEnabled = (payload.reminder_enabled ?? existing.reminder_enabled) ?? false;
        const reminderOptions = {
            reminder_enabled: reminderEnabled,
            due_at: payload.due_at ?? existing.due_at,
            next_reminder_at: payload.next_reminder_at ?? existing.next_reminder_at
        };
        if (payload.reminder_frequency !== undefined) {
            reminderOptions.reminder_frequency = payload.reminder_frequency;
        }
        else if (existing.reminder_frequency) {
            reminderOptions.reminder_frequency = existing.reminder_frequency;
        }
        const reminderFields = this.prepareReminderOptions(reminderOptions);
        await this.taskRepository.update(taskId, {
            ...payload,
            ...reminderFields
        });
        return this.taskRepository.findById(taskId);
    }
    async deleteTask(taskId) {
        if (!taskId || taskId <= 0) {
            throw new Error('Valid task ID is required');
        }
        return this.taskRepository.delete(taskId);
    }
    async getReminderLogs(taskId, limit = 50) {
        if (!taskId || taskId <= 0) {
            throw new Error('Valid task ID is required');
        }
        if (!this.reminderLogRepository) {
            return [];
        }
        return this.reminderLogRepository.findByTaskId(taskId, limit);
    }
    async getQuoteTaskProgress(quoteId) {
        if (!quoteId || quoteId <= 0) {
            throw new Error('Valid quote ID is required');
        }
        return this.taskRepository.getProgressSummary(quoteId);
    }
    async processPendingReminders(channel = 'whatsapp', limit = 100) {
        const tasks = await this.taskRepository.findPendingReminders(channel, limit);
        let processed = 0;
        for (const task of tasks) {
            try {
                await this.sendWhatsappReminder(task);
                const nextReminder = this.calculateNextReminder(task);
                await this.taskRepository.updateReminderState(task.id, nextReminder ? 'pending' : 'sent', nextReminder);
                processed++;
            }
            catch (error) {
                await this.logReminder(task, 'failed', this.buildWhatsappMessage(task), error);
                await this.taskRepository.updateReminderState(task.id, 'failed', task.next_reminder_at || null, error instanceof Error ? error.message : 'Unknown reminder error');
            }
        }
        return { channel, processed };
    }
    async scheduleTaskReminder(taskId) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (!task.reminder_enabled) {
            throw new Error('Reminders are disabled for this task');
        }
        await this.sendWhatsappReminder(task);
        const nextReminder = this.calculateNextReminder(task);
        await this.taskRepository.updateReminderState(task.id, nextReminder ? 'pending' : 'sent', nextReminder);
    }
    async recordIncomingReply(taskId, options) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found for incoming reply');
        }
        const normalizedMessage = options.message?.trim().toLowerCase() || '';
        let newStatus;
        if (normalizedMessage.includes('done') || normalizedMessage.includes('complete')) {
            newStatus = 'completed';
        }
        else if (normalizedMessage.includes('progress') || normalizedMessage.includes('working')) {
            newStatus = 'in_progress';
        }
        else if (normalizedMessage.includes('blocked')) {
            newStatus = 'blocked';
        }
        await this.logReminder(task, 'pending', options.message, undefined, 'inbound', options.from, options.providerPayload);
        if (newStatus && newStatus !== task.status) {
            await this.taskRepository.update(taskId, { status: newStatus });
        }
    }
    prepareReminderOptions(options) {
        if (!options.reminder_enabled) {
            return {
                reminder_enabled: false,
                next_reminder_at: null,
                reminder_status: 'pending',
                reminder_error: null
            };
        }
        const nextReminder = this.calculateNextReminder({
            reminder_enabled: options.reminder_enabled,
            reminder_frequency: options.reminder_frequency,
            due_at: options.due_at,
            next_reminder_at: options.next_reminder_at
        });
        return {
            reminder_enabled: true,
            reminder_status: 'pending',
            reminder_error: null,
            reminder_frequency: options.reminder_frequency || 'once',
            next_reminder_at: nextReminder
        };
    }
    calculateNextReminder(task) {
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
    async sendWhatsappReminder(task) {
        const message = this.buildWhatsappMessage(task);
        try {
            console.log(`[Reminder] WhatsApp reminder queued for task #${task.id}: ${message}`);
            await this.logReminder(task, 'sent', message);
        }
        catch (error) {
            await this.logReminder(task, 'failed', message, error);
            throw error;
        }
    }
    buildWhatsappMessage(task) {
        const dueText = task.due_at ? `Due: ${new Date(task.due_at).toLocaleString()}` : 'Due date not set';
        return `Task "${task.title}" for Quote #${task.quote_id}. ${dueText}. Status: ${task.status}`;
    }
    async logReminder(task, status, message, error, direction = 'outbound', replyFrom, providerPayload) {
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
//# sourceMappingURL=TaskService.js.map