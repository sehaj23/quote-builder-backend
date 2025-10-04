import { getConnection } from '@/config/database.js';
export class UserRepository {
    async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC');
        return rows;
    }
    async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findByEmail(email) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows.length > 0 ? rows[0] : null;
    }
    async create(userData) {
        const connection = getConnection();
        const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await connection.execute(`INSERT INTO users (id, email, cognito_id, name, first_name, last_name, company_id, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            userData.email,
            userData.cognitoId,
            userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || null,
            userData.firstName || null,
            userData.lastName || null,
            userData.company_id || null,
            userData.isApproved || false
        ]);
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('Failed to create user');
        }
        return user;
    }
    async update(id, updateData) {
        const connection = getConnection();
        const fields = [];
        const values = [];
        if (updateData.name !== undefined) {
            fields.push('name = ?');
            values.push(updateData.name);
        }
        if (updateData.is_super_user !== undefined) {
            fields.push('is_super_user = ?');
            values.push(updateData.is_super_user);
        }
        if (updateData.is_approved !== undefined) {
            fields.push('is_approved = ?');
            values.push(updateData.is_approved);
        }
        if (updateData.company_id !== undefined) {
            fields.push('company_id = ?');
            values.push(updateData.company_id);
        }
        if (updateData.last_activity !== undefined) {
            fields.push('last_activity = ?');
            values.push(updateData.last_activity);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await connection.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    async findPending() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE is_approved = FALSE ORDER BY created_at DESC');
        return rows;
    }
    async findApproved() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE is_approved = TRUE ORDER BY created_at DESC');
        return rows;
    }
    async findByCompany(companyId) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        return rows;
    }
    async updateLastActivity(id) {
        const connection = getConnection();
        await connection.execute('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    }
    async getStats() {
        const connection = getConnection();
        const [totalRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [approvedRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_approved = TRUE');
        const [pendingRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_approved = FALSE');
        const [superUserRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_super_user = TRUE');
        return {
            total: totalRows[0]?.count || 0,
            approved: approvedRows[0]?.count || 0,
            pending: pendingRows[0]?.count || 0,
            superUsers: superUserRows[0]?.count || 0
        };
    }
    async findSuperUsers() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE is_super_user = TRUE ORDER BY created_at DESC');
        return rows;
    }
    async findRecentlyActive(limit = 10) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE last_activity IS NOT NULL ORDER BY last_activity DESC LIMIT ?', [limit]);
        return rows;
    }
}
//# sourceMappingURL=UserRepository.js.map