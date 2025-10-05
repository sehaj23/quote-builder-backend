import { getConnection } from '../config/database.js';
export class AttachmentRepository {
    async create(attachmentData) {
        const connection = getConnection();
        const [result] = await connection.execute(`INSERT INTO attachments (
        company_id, filename, original_filename, s3_key, s3_url, 
        file_size, mime_type, type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            attachmentData.company_id,
            attachmentData.filename,
            attachmentData.original_filename,
            attachmentData.s3_key,
            attachmentData.s3_url,
            attachmentData.file_size || null,
            attachmentData.mime_type || null,
            attachmentData.type || 'document',
            attachmentData.uploaded_by || null
        ]);
        const attachment = await this.findById(result.insertId);
        if (!attachment) {
            throw new Error('Failed to create attachment');
        }
        return attachment;
    }
    async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM attachments WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findByCompany(companyId, type) {
        const connection = getConnection();
        let query = 'SELECT * FROM attachments WHERE company_id = ?';
        const params = [companyId];
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async findByUser(userId) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM attachments WHERE uploaded_by = ? ORDER BY created_at DESC', [userId]);
        return rows;
    }
    async findByType(type, companyId) {
        const connection = getConnection();
        let query = 'SELECT * FROM attachments WHERE type = ?';
        const params = [type];
        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async update(id, updateData) {
        const connection = getConnection();
        const fields = [];
        const values = [];
        if (updateData.filename) {
            fields.push('filename = ?');
            values.push(updateData.filename);
        }
        if (updateData.original_filename) {
            fields.push('original_filename = ?');
            values.push(updateData.original_filename);
        }
        if (updateData.type) {
            fields.push('type = ?');
            values.push(updateData.type);
        }
        if (updateData.mime_type) {
            fields.push('mime_type = ?');
            values.push(updateData.mime_type);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await connection.execute(`UPDATE attachments SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM attachments WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    async findLogo(companyId) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM attachments WHERE company_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1', [companyId, 'logo']);
        return rows.length > 0 ? rows[0] : null;
    }
    async findAll(limit, offset) {
        const connection = getConnection();
        let query = 'SELECT * FROM attachments ORDER BY created_at DESC';
        const params = [];
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
            if (offset) {
                query += ' OFFSET ?';
                params.push(offset);
            }
        }
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async getStats(companyId) {
        const connection = getConnection();
        let whereClause = '';
        const params = [];
        if (companyId) {
            whereClause = 'WHERE company_id = ?';
            params.push(companyId);
        }
        const [totalRows] = await connection.execute(`SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM attachments ${whereClause}`, params);
        const [typeRows] = await connection.execute(`SELECT type, COUNT(*) as count FROM attachments ${whereClause} GROUP BY type`, params);
        const byType = {};
        typeRows.forEach((row) => {
            byType[row.type] = row.count;
        });
        return {
            total: totalRows[0]?.count || 0,
            totalSize: totalRows[0]?.total_size || 0,
            byType
        };
    }
    async findRecent(limit = 10, companyId) {
        const connection = getConnection();
        let query = 'SELECT * FROM attachments';
        const params = [];
        if (companyId) {
            query += ' WHERE company_id = ?';
            params.push(companyId);
        }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        const [rows] = await connection.execute(query, params);
        return rows;
    }
    async findByS3Key(s3Key) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM attachments WHERE s3_key = ?', [s3Key]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findLargeFiles(minSize, companyId) {
        const connection = getConnection();
        let query = 'SELECT * FROM attachments WHERE file_size >= ?';
        const params = [minSize];
        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }
        query += ' ORDER BY file_size DESC';
        const [rows] = await connection.execute(query, params);
        return rows;
    }
}
//# sourceMappingURL=AttachmentRepository.js.map