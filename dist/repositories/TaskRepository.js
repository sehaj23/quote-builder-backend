import { getConnection } from '../config/database.js';
export class TaskRepository {
    getDbConnection() {
        return getConnection();
    }
    async create(taskData) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`INSERT INTO tasks (
          quote_id,
          company_id,
          title,
          description,
          status,
          priority,
          due_at,
          assigned_to,
          assigned_phone,
          reminder_enabled,
          reminder_channel,
          reminder_frequency,
          next_reminder_at,
          reminder_status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                taskData.quote_id,
                taskData.company_id,
                taskData.title,
                taskData.description || null,
                taskData.status || 'pending',
                taskData.priority || 'medium',
                taskData.due_at || null,
                taskData.assigned_to || null,
                taskData.assigned_phone || null,
                taskData.reminder_enabled ?? false,
                taskData.reminder_channel || 'whatsapp',
                taskData.reminder_frequency || 'once',
                taskData.next_reminder_at || null,
                taskData.reminder_status || 'pending',
                taskData.created_by || null
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating task:', error);
            throw new Error('Failed to create task in database');
        }
    }
    async findByQuoteId(quoteId, filters = {}) {
        try {
            const connection = this.getDbConnection();
            let query = 'SELECT * FROM tasks WHERE quote_id = ?';
            const params = [quoteId];
            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }
            if (filters.priority) {
                query += ' AND priority = ?';
                params.push(filters.priority);
            }
            if (filters.search && filters.search.trim().length > 0) {
                const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
                query +=
                    ' AND (LOWER(title) LIKE ? OR LOWER(IFNULL(description, \'\')) LIKE ? OR LOWER(IFNULL(assigned_to, \'\')) LIKE ?)';
                params.push(searchTerm, searchTerm, searchTerm);
            }
            if (filters.overdueOnly) {
                query += " AND due_at IS NOT NULL AND due_at < NOW() AND status != 'completed'";
            }
            query += ' ORDER BY due_at IS NULL, due_at ASC, created_at DESC';
            const [rows] = await connection.execute(query, params);
            return rows;
        }
        catch (error) {
            console.error('Error fetching tasks by quote:', error);
            throw new Error('Failed to fetch tasks from database');
        }
    }
    async findById(taskId) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ? LIMIT 1', [taskId]);
            if (!rows.length) {
                return null;
            }
            return rows[0];
        }
        catch (error) {
            console.error('Error fetching task by id:', error);
            throw new Error('Failed to fetch task from database');
        }
    }
    async update(taskId, taskData) {
        try {
            if (!taskId) {
                throw new Error('Task ID is required');
            }
            const fields = [];
            const values = [];
            const updatableFields = [
                'title',
                'description',
                'status',
                'priority',
                'due_at',
                'assigned_to',
                'assigned_phone',
                'reminder_enabled',
                'reminder_channel',
                'reminder_frequency',
                'next_reminder_at',
                'reminder_status',
                'reminder_error'
            ];
            for (const field of updatableFields) {
                if (taskData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(taskData[field]);
                }
            }
            if (!fields.length) {
                return true;
            }
            values.push(taskId);
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating task:', error);
            throw new Error('Failed to update task in database');
        }
    }
    async delete(taskId) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error deleting task:', error);
            throw new Error('Failed to delete task from database');
        }
    }
    async getProgressSummary(quoteId) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute(`SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN due_at IS NOT NULL AND due_at < NOW() AND status != 'completed' THEN 1 ELSE 0 END) AS overdue
        FROM tasks
        WHERE quote_id = ?`, [quoteId]);
            const summary = rows[0];
            const total = Number(summary?.total || 0);
            const completed = Number(summary?.completed || 0);
            const inProgress = Number(summary?.in_progress || 0);
            const pending = Number(summary?.pending || 0);
            const overdue = Number(summary?.overdue || 0);
            const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100);
            return {
                total,
                completed,
                overdue,
                in_progress: inProgress,
                pending,
                percent_complete: percentComplete
            };
        }
        catch (error) {
            console.error('Error computing task progress summary:', error);
            throw new Error('Failed to compute task progress');
        }
    }
    async findPendingReminders(channel = 'whatsapp', limit = 100) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute(`SELECT *
         FROM tasks
         WHERE reminder_enabled = TRUE
           AND reminder_channel = ?
           AND reminder_status IN ('pending','snoozed')
           AND next_reminder_at IS NOT NULL
           AND next_reminder_at <= NOW()
         ORDER BY next_reminder_at ASC
         LIMIT ?`, [channel, limit]);
            return rows;
        }
        catch (error) {
            console.error('Error fetching pending reminders:', error);
            throw new Error('Failed to fetch pending reminders');
        }
    }
    async updateReminderState(taskId, status, nextReminderAt, errorMessage) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`UPDATE tasks
         SET reminder_status = ?,
             next_reminder_at = ?,
             reminder_error = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`, [status, nextReminderAt, errorMessage || null, taskId]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating reminder state:', error);
            throw new Error('Failed to update reminder state');
        }
    }
}
//# sourceMappingURL=TaskRepository.js.map