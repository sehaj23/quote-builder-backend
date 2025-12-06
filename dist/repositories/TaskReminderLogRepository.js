import { getConnection } from '../config/database.js';
export class TaskReminderLogRepository {
    getDbConnection() {
        return getConnection();
    }
    async create(log) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`INSERT INTO task_reminder_logs (
          task_id,
          channel,
          status,
          message_body,
          provider_message_id,
          error_message,
          metadata,
          direction,
          reply_from,
          sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                log.task_id,
                log.channel || 'whatsapp',
                log.status,
                log.message_body || null,
                log.provider_message_id || null,
                log.error_message || null,
                log.metadata ? JSON.stringify(log.metadata) : null,
                log.direction || 'outbound',
                log.reply_from || null,
                log.sent_at || new Date()
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating task reminder log:', error);
            throw new Error('Failed to create task reminder log');
        }
    }
    async findByTaskId(taskId, limit = 50) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute(`SELECT id, task_id, channel, status, message_body, provider_message_id, error_message,
                metadata, direction, reply_from, sent_at, created_at
         FROM task_reminder_logs
         WHERE task_id = ?
         ORDER BY sent_at DESC
         LIMIT ?`, [taskId, limit]);
            return rows.map((row) => ({
                ...row,
                metadata: row.metadata ? JSON.parse(row.metadata) : null
            }));
        }
        catch (error) {
            console.error('Error fetching reminder logs:', error);
            throw new Error('Failed to fetch task reminder logs');
        }
    }
}
//# sourceMappingURL=TaskReminderLogRepository.js.map