import { getConnection } from '@/config/database.js';
import { Attachment, CreateAttachmentRequest } from '@/types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AttachmentRepository {
  async create(attachmentData: CreateAttachmentRequest): Promise<Attachment> {
    const connection = getConnection();
    
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO attachments (
        company_id, filename, original_filename, s3_key, s3_url, 
        file_size, mime_type, type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attachmentData.company_id,
        attachmentData.filename,
        attachmentData.original_filename,
        attachmentData.s3_key,
        attachmentData.s3_url,
        attachmentData.file_size || null,
        attachmentData.mime_type || null,
        attachmentData.type || 'document',
        attachmentData.uploaded_by || null
      ]
    );

    const attachment = await this.findById(result.insertId);
    if (!attachment) {
      throw new Error('Failed to create attachment');
    }
    
    return attachment;
  }

  async findById(id: number): Promise<Attachment | null> {
    const connection = getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM attachments WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Attachment) : null;
  }

  async findByCompany(companyId: number, type?: string): Promise<Attachment[]> {
    const connection = getConnection();
    
    let query = 'SELECT * FROM attachments WHERE company_id = ?';
    const params: any[] = [companyId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Attachment[];
  }

  async findByUser(userId: string): Promise<Attachment[]> {
    const connection = getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM attachments WHERE uploaded_by = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows as Attachment[];
  }

  async findByType(type: string, companyId?: number): Promise<Attachment[]> {
    const connection = getConnection();
    
    let query = 'SELECT * FROM attachments WHERE type = ?';
    const params: any[] = [type];
    
    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Attachment[];
  }

  async update(id: number, updateData: Partial<Attachment>): Promise<Attachment | null> {
    const connection = getConnection();
    
    const fields: string[] = [];
    const values: any[] = [];
    
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
    
    await connection.execute<ResultSetHeader>(
      `UPDATE attachments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const connection = getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM attachments WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async findLogo(companyId: number): Promise<Attachment | null> {
    const connection = getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM attachments WHERE company_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [companyId, 'logo']
    );
    return rows.length > 0 ? (rows[0] as Attachment) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<Attachment[]> {
    const connection = getConnection();
    
    let query = 'SELECT * FROM attachments ORDER BY created_at DESC';
    const params: any[] = [];
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Attachment[];
  }

  async getStats(companyId?: number): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const connection = getConnection();
    
    let whereClause = '';
    const params: any[] = [];
    
    if (companyId) {
      whereClause = 'WHERE company_id = ?';
      params.push(companyId);
    }
    
    const [totalRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM attachments ${whereClause}`,
      params
    );
    
    const [typeRows] = await connection.execute<RowDataPacket[]>(
      `SELECT type, COUNT(*) as count FROM attachments ${whereClause} GROUP BY type`,
      params
    );
    
    const byType: Record<string, number> = {};
    typeRows.forEach((row: any) => {
      byType[row.type] = row.count;
    });
    
    return {
      total: totalRows[0]?.count || 0,
      totalSize: totalRows[0]?.total_size || 0,
      byType
    };
  }

  async findRecent(limit: number = 10, companyId?: number): Promise<Attachment[]> {
    const connection = getConnection();
    
    let query = 'SELECT * FROM attachments';
    const params: any[] = [];
    
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Attachment[];
  }

  async findByS3Key(s3Key: string): Promise<Attachment | null> {
    const connection = getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM attachments WHERE s3_key = ?',
      [s3Key]
    );
    return rows.length > 0 ? (rows[0] as Attachment) : null;
  }

  async findLargeFiles(minSize: number, companyId?: number): Promise<Attachment[]> {
    const connection = getConnection();
    
    let query = 'SELECT * FROM attachments WHERE file_size >= ?';
    const params: any[] = [minSize];
    
    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }
    
    query += ' ORDER BY file_size DESC';
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows as Attachment[];
  }
}