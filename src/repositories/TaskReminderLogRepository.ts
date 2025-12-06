import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection } from '../config/database.js';
import { CreateTaskReminderLogRequest, TaskReminderLog } from '../types/index.js';

export class TaskReminderLogRepository {
  private getDbConnection() {
    return getConnection();
  }

  async create(log: CreateTaskReminderLogRequest): Promise<number> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO task_reminder_logs (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating task reminder log:', error);
      throw new Error('Failed to create task reminder log');
    }
  }

  async findByTaskId(taskId: number, limit = 50): Promise<TaskReminderLog[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, task_id, channel, status, message_body, provider_message_id, error_message,
                metadata, direction, reply_from, sent_at, created_at
         FROM task_reminder_logs
         WHERE task_id = ?
         ORDER BY sent_at DESC
         LIMIT ?`,
        [taskId, limit]
      );

      return rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      })) as TaskReminderLog[];
    } catch (error) {
      console.error('Error fetching reminder logs:', error);
      throw new Error('Failed to fetch task reminder logs');
    }
  }
}

