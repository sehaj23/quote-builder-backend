import { getConnection } from '../config/database.js';
import { UserActivity, CreateActivityRequest } from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface FindActivitiesOptions {
  userId?: string;
  companyId?: number;
  action?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

export class ActivityRepository {
  async create(activityData: CreateActivityRequest): Promise<UserActivity> {
    const connection = getConnection();
    
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO user_activity (
        user_id, company_id, action, resource_type, resource_id, 
        description, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activityData.user_id,
        activityData.company_id || null,
        activityData.action,
        activityData.resource_type || null,
        activityData.resource_id || null,
        activityData.description || null,
        activityData.ip_address || null,
        activityData.user_agent || null
      ]
    );

    const activity = await this.findById(result.insertId);
    if (!activity) {
      throw new Error('Failed to log activity');
    }
    
    return activity;
  }

  async findById(id: number): Promise<UserActivity | null> {
    const connection = getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
       FROM user_activity ua 
       LEFT JOIN users u ON ua.user_id = u.id 
       LEFT JOIN companies c ON ua.company_id = c.id
       WHERE ua.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as UserActivity) : null;
  }

  async findAll(options: FindActivitiesOptions = {}): Promise<UserActivity[]> {
    const connection = getConnection();
    
    let query = `
      SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id 
      LEFT JOIN companies c ON ua.company_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (options.userId) {
      query += ' AND ua.user_id = ?';
      params.push(options.userId);
    }
    
    if (options.companyId) {
      query += ' AND ua.company_id = ?';
      params.push(options.companyId);
    }
    
    if (options.action) {
      query += ' AND ua.action = ?';
      params.push(options.action);
    }
    
    if (options.resourceType) {
      query += ' AND ua.resource_type = ?';
      params.push(options.resourceType);
    }
    
    if (options.dateFrom) {
      query += ' AND ua.created_at >= ?';
      params.push(options.dateFrom);
    }
    
    if (options.dateTo) {
      query += ' AND ua.created_at <= ?';
      params.push(options.dateTo);
    }
    
    query += ' ORDER BY ua.created_at DESC';
    
    if (options.limit) {
      if (options.offset && options.offset > 0) {
        query += ' LIMIT ? OFFSET ?';
        params.push(options.limit, options.offset);
      } else {
        query += ' LIMIT ?';
        params.push(options.limit);
      }
    }
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as UserActivity[];
  }

  async findByUser(userId: string, limit: number = 50, offset: number = 0): Promise<UserActivity[]> {
    return this.findAll({ userId, limit, offset });
  }

  async findByCompany(companyId: number, limit: number = 50, offset: number = 0): Promise<UserActivity[]> {
    return this.findAll({ companyId, limit, offset });
  }

  async findByAction(action: string, companyId?: number): Promise<UserActivity[]> {
    const options: any = { action };
    if (companyId !== undefined) {
      options.companyId = companyId;
    }
    return this.findAll(options);
  }

  async findByResourceType(resourceType: string, companyId?: number): Promise<UserActivity[]> {
    const options: any = { resourceType };
    if (companyId !== undefined) {
      options.companyId = companyId;
    }
    return this.findAll(options);
  }

  async findRecent(limit: number = 20): Promise<UserActivity[]> {
    return this.findAll({ limit });
  }

  async findByDateRange(dateFrom: string, dateTo: string, options: Omit<FindActivitiesOptions, 'dateFrom' | 'dateTo'> = {}): Promise<UserActivity[]> {
    return this.findAll({ ...options, dateFrom, dateTo });
  }

  async getStats(companyId?: number): Promise<{
    totalActivities: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    recentActivity: UserActivity[];
    activitiesByDay: Array<{ date: string; count: number }>;
  }> {
    const connection = getConnection();
    
    let whereClause = '';
    const params: any[] = [];
    
    if (companyId) {
      whereClause = 'WHERE company_id = ?';
      params.push(companyId);
    }
    
    // Total activities
    const [totalRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM user_activity ${whereClause}`,
      params
    );
    
    // Unique users
    const [uniqueUsersRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT user_id) as count FROM user_activity ${whereClause}`,
      params
    );
    
    // Top actions
    const [topActionsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT action, COUNT(*) as count 
       FROM user_activity ${whereClause} 
       GROUP BY action 
       ORDER BY count DESC 
       LIMIT 10`,
      params
    );
    
    // Activities by day (last 7 days)
    const [activitiesByDayRows] = await connection.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM user_activity ${whereClause ? whereClause + ' AND' : 'WHERE'} 
       created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      params
    );
    
    // Recent activity
    const options: any = { limit: 10 };
    if (companyId !== undefined) {
      options.companyId = companyId;
    }
    const recentActivity = await this.findAll(options);
    
    return {
      totalActivities: totalRows[0]?.count || 0,
      uniqueUsers: uniqueUsersRows[0]?.count || 0,
      topActions: topActionsRows as Array<{ action: string; count: number }>,
      recentActivity,
      activitiesByDay: activitiesByDayRows as Array<{ date: string; count: number }>
    };
  }

  async delete(id: number): Promise<boolean> {
    const connection = getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM user_activity WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async cleanup(daysToKeep: number = 90): Promise<number> {
    const connection = getConnection();
    
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM user_activity WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysToKeep]
    );
    
    return result.affectedRows;
  }

  async findByResourceId(resourceType: string, resourceId: number, companyId?: number): Promise<UserActivity[]> {
    const connection = getConnection();
    
    let query = `
      SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id 
      LEFT JOIN companies c ON ua.company_id = c.id
      WHERE ua.resource_type = ? AND ua.resource_id = ?
    `;
    const params: any[] = [resourceType, resourceId];
    
    if (companyId) {
      query += ' AND ua.company_id = ?';
      params.push(companyId);
    }
    
    query += ' ORDER BY ua.created_at DESC';
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as UserActivity[];
  }

  async countByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<number> {
    const connection = getConnection();
    
    let query = 'SELECT COUNT(*) as count FROM user_activity WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (dateFrom) {
      query += ' AND created_at >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND created_at <= ?';
      params.push(dateTo);
    }
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows[0]?.count || 0;
  }

  async findMostActiveUsers(limit: number = 10, companyId?: number): Promise<Array<{ userId: string; userName: string; userEmail: string; activityCount: number }>> {
    const connection = getConnection();
    
    let query = `
      SELECT ua.user_id as userId, u.name as userName, u.email as userEmail, COUNT(*) as activityCount
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (companyId) {
      query += ' AND ua.company_id = ?';
      params.push(companyId);
    }
    
    query += ' GROUP BY ua.user_id, u.name, u.email ORDER BY activityCount DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Array<{ userId: string; userName: string; userEmail: string; activityCount: number }>;
  }
}