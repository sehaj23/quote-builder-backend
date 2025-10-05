import { getConnection } from '../config/database.js';
export class ActivityRepository {
    async create(activityData) {
        const connection = getConnection();
        const [result] = await connection.execute(`INSERT INTO user_activity (
        user_id, company_id, action, resource_type, resource_id, 
        description, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            activityData.user_id,
            activityData.company_id || null,
            activityData.action,
            activityData.resource_type || null,
            activityData.resource_id || null,
            activityData.description || null,
            activityData.ip_address || null,
            activityData.user_agent || null
        ]);
        const activity = await this.findById(result.insertId);
        if (!activity) {
            throw new Error('Failed to log activity');
        }
        return activity;
    }
    async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(`SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
       FROM user_activity ua 
       LEFT JOIN users u ON ua.user_id = u.id 
       LEFT JOIN companies c ON ua.company_id = c.id
       WHERE ua.id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findAll(options = {}) {
        const connection = getConnection();
        let query = `
      SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id 
      LEFT JOIN companies c ON ua.company_id = c.id 
      WHERE 1=1
    `;
        const params = [];
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
            query += ' LIMIT ?';
            params.push(options.limit);
            if (options.offset) {
                query += ' OFFSET ?';
                params.push(options.offset);
            }
        }
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async findByUser(userId, limit = 50, offset = 0) {
        return this.findAll({ userId, limit, offset });
    }
    async findByCompany(companyId, limit = 50, offset = 0) {
        return this.findAll({ companyId, limit, offset });
    }
    async findByAction(action, companyId) {
        const options = { action };
        if (companyId !== undefined) {
            options.companyId = companyId;
        }
        return this.findAll(options);
    }
    async findByResourceType(resourceType, companyId) {
        const options = { resourceType };
        if (companyId !== undefined) {
            options.companyId = companyId;
        }
        return this.findAll(options);
    }
    async findRecent(limit = 20) {
        return this.findAll({ limit });
    }
    async findByDateRange(dateFrom, dateTo, options = {}) {
        return this.findAll({ ...options, dateFrom, dateTo });
    }
    async getStats(companyId) {
        const connection = getConnection();
        let whereClause = '';
        const params = [];
        if (companyId) {
            whereClause = 'WHERE company_id = ?';
            params.push(companyId);
        }
        const [totalRows] = await connection.execute(`SELECT COUNT(*) as count FROM user_activity ${whereClause}`, params);
        const [uniqueUsersRows] = await connection.execute(`SELECT COUNT(DISTINCT user_id) as count FROM user_activity ${whereClause}`, params);
        const [topActionsRows] = await connection.execute(`SELECT action, COUNT(*) as count 
       FROM user_activity ${whereClause} 
       GROUP BY action 
       ORDER BY count DESC 
       LIMIT 10`, params);
        const [activitiesByDayRows] = await connection.execute(`SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM user_activity ${whereClause ? whereClause + ' AND' : 'WHERE'} 
       created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`, params);
        const options = { limit: 10 };
        if (companyId !== undefined) {
            options.companyId = companyId;
        }
        const recentActivity = await this.findAll(options);
        return {
            totalActivities: totalRows[0]?.count || 0,
            uniqueUsers: uniqueUsersRows[0]?.count || 0,
            topActions: topActionsRows,
            recentActivity,
            activitiesByDay: activitiesByDayRows
        };
    }
    async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM user_activity WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    async cleanup(daysToKeep = 90) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM user_activity WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [daysToKeep]);
        return result.affectedRows;
    }
    async findByResourceId(resourceType, resourceId, companyId) {
        const connection = getConnection();
        let query = `
      SELECT ua.*, u.name as user_name, u.email as user_email, c.name as company_name
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id 
      LEFT JOIN companies c ON ua.company_id = c.id
      WHERE ua.resource_type = ? AND ua.resource_id = ?
    `;
        const params = [resourceType, resourceId];
        if (companyId) {
            query += ' AND ua.company_id = ?';
            params.push(companyId);
        }
        query += ' ORDER BY ua.created_at DESC';
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async countByUser(userId, dateFrom, dateTo) {
        const connection = getConnection();
        let query = 'SELECT COUNT(*) as count FROM user_activity WHERE user_id = ?';
        const params = [userId];
        if (dateFrom) {
            query += ' AND created_at >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND created_at <= ?';
            params.push(dateTo);
        }
        const [rows] = await connection.execute(query, params);
        return rows[0]?.count || 0;
    }
    async findMostActiveUsers(limit = 10, companyId) {
        const connection = getConnection();
        let query = `
      SELECT ua.user_id as userId, u.name as userName, u.email as userEmail, COUNT(*) as activityCount
      FROM user_activity ua 
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (companyId) {
            query += ' AND ua.company_id = ?';
            params.push(companyId);
        }
        query += ' GROUP BY ua.user_id, u.name, u.email ORDER BY activityCount DESC LIMIT ?';
        params.push(limit);
        const [rows] = await connection.execute(query, params);
        return rows;
    }
}
//# sourceMappingURL=ActivityRepository.js.map