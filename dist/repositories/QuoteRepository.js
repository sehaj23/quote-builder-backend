import { getConnection } from '@/config/database.js';
export class QuoteRepository {
    getDbConnection() {
        return getConnection();
    }
    async findByCompanyId(companyId, limit, offset) {
        try {
            const connection = this.getDbConnection();
            let query = 'SELECT * FROM quotes WHERE company_id = ? ORDER BY created_at DESC';
            const params = [companyId];
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
        catch (error) {
            console.error('Error fetching quotes for company:', error);
            throw new Error('Failed to fetch quotes from database');
        }
    }
    async findById(id) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM quotes WHERE id = ?', [id]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0];
        }
        catch (error) {
            console.error('Error fetching quote by ID:', error);
            throw new Error('Failed to fetch quote from database');
        }
    }
    async findByIdWithLines(id) {
        try {
            const quote = await this.findById(id);
            if (!quote) {
                return null;
            }
            const lines = await this.getQuoteLines(id);
            return {
                quote,
                lines
            };
        }
        catch (error) {
            console.error('Error fetching quote with lines:', error);
            throw new Error('Failed to fetch quote with lines from database');
        }
    }
    async getQuoteLines(quoteId) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY id ASC', [quoteId]);
            return rows;
        }
        catch (error) {
            console.error('Error fetching quote lines:', error);
            throw new Error('Failed to fetch quote lines from database');
        }
    }
    async create(quoteData) {
        const connection = this.getDbConnection();
        try {
            await connection.beginTransaction();
            const [quoteResult] = await connection.execute(`INSERT INTO quotes (
          company_id, quote_number, project_name, customer_name, customer_email, 
          customer_mobile, tier, status, subtotal, tax, discount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                quoteData.company_id,
                quoteData.quote_number,
                quoteData.project_name || null,
                quoteData.customer_name || null,
                quoteData.customer_email || null,
                quoteData.customer_mobile || null,
                quoteData.tier || 'economy',
                quoteData.status || 'draft',
                quoteData.subtotal || 0,
                quoteData.tax || 0,
                quoteData.discount || 0,
                quoteData.total || 0
            ]);
            const quoteId = quoteResult.insertId;
            if (quoteData.lines && quoteData.lines.length > 0) {
                for (const line of quoteData.lines) {
                    await connection.execute(`INSERT INTO quote_lines (
              quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                        quoteId,
                        line.item_id || null,
                        line.description || null,
                        line.unit || null,
                        line.quantity || 1,
                        line.area || 1,
                        line.unit_rate || 0,
                        line.line_total || 0
                    ]);
                }
            }
            await connection.commit();
            return quoteId;
        }
        catch (error) {
            await connection.rollback();
            console.error('Error creating quote:', error);
            throw new Error('Failed to create quote in database');
        }
    }
    async update(id, quoteData) {
        const connection = this.getDbConnection();
        try {
            await connection.beginTransaction();
            const updates = [];
            const values = [];
            if (quoteData.project_name !== undefined) {
                updates.push('project_name = ?');
                values.push(quoteData.project_name);
            }
            if (quoteData.customer_name !== undefined) {
                updates.push('customer_name = ?');
                values.push(quoteData.customer_name);
            }
            if (quoteData.customer_email !== undefined) {
                updates.push('customer_email = ?');
                values.push(quoteData.customer_email);
            }
            if (quoteData.customer_mobile !== undefined) {
                updates.push('customer_mobile = ?');
                values.push(quoteData.customer_mobile);
            }
            if (quoteData.tier !== undefined) {
                updates.push('tier = ?');
                values.push(quoteData.tier);
            }
            if (quoteData.status !== undefined) {
                updates.push('status = ?');
                values.push(quoteData.status);
            }
            if (quoteData.subtotal !== undefined) {
                updates.push('subtotal = ?');
                values.push(quoteData.subtotal);
            }
            if (quoteData.tax !== undefined) {
                updates.push('tax = ?');
                values.push(quoteData.tax);
            }
            if (quoteData.discount !== undefined) {
                updates.push('discount = ?');
                values.push(quoteData.discount);
            }
            if (quoteData.total !== undefined) {
                updates.push('total = ?');
                values.push(quoteData.total);
            }
            if (updates.length > 0) {
                updates.push('updated_at = CURRENT_TIMESTAMP');
                values.push(id);
                const query = `UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`;
                await connection.execute(query, values);
            }
            if (quoteData.lines !== undefined) {
                await connection.execute('DELETE FROM quote_lines WHERE quote_id = ?', [id]);
                if (quoteData.lines.length > 0) {
                    for (const line of quoteData.lines) {
                        await connection.execute(`INSERT INTO quote_lines (
                quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                            id,
                            line.item_id || null,
                            line.description || null,
                            line.unit || null,
                            line.quantity || 1,
                            line.area || 1,
                            line.unit_rate || 0,
                            line.line_total || 0
                        ]);
                    }
                }
            }
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            console.error('Error updating quote:', error);
            throw new Error('Failed to update quote in database');
        }
    }
    async delete(id) {
        const connection = this.getDbConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM quote_lines WHERE quote_id = ?', [id]);
            const [result] = await connection.execute('DELETE FROM quotes WHERE id = ?', [id]);
            await connection.commit();
            return result.affectedRows > 0;
        }
        catch (error) {
            await connection.rollback();
            console.error('Error deleting quote:', error);
            throw new Error('Failed to delete quote from database');
        }
    }
    async search(companyId, query) {
        try {
            const connection = this.getDbConnection();
            const searchTerm = `%${query}%`;
            const [rows] = await connection.execute(`SELECT * FROM quotes 
         WHERE company_id = ? 
         AND (quote_number LIKE ? OR customer_name LIKE ? OR project_name LIKE ?)
         ORDER BY created_at DESC`, [companyId, searchTerm, searchTerm, searchTerm]);
            return rows;
        }
        catch (error) {
            console.error('Error searching quotes:', error);
            throw new Error('Failed to search quotes in database');
        }
    }
    async duplicate(id, newQuoteNumber, newTier) {
        const connection = this.getDbConnection();
        try {
            await connection.beginTransaction();
            const originalQuote = await this.findById(id);
            if (!originalQuote) {
                throw new Error('Original quote not found');
            }
            const originalLines = await this.getQuoteLines(id);
            const [quoteResult] = await connection.execute(`INSERT INTO quotes (
          company_id, quote_number, project_name, customer_name, customer_email, 
          customer_mobile, tier, status, subtotal, tax, discount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                originalQuote.company_id,
                newQuoteNumber,
                originalQuote.project_name,
                originalQuote.customer_name,
                originalQuote.customer_email,
                originalQuote.customer_mobile,
                newTier || originalQuote.tier,
                'draft',
                originalQuote.subtotal,
                originalQuote.tax,
                originalQuote.discount,
                originalQuote.total
            ]);
            const newQuoteId = quoteResult.insertId;
            for (const line of originalLines) {
                await connection.execute(`INSERT INTO quote_lines (
            quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                    newQuoteId,
                    line.item_id,
                    line.description,
                    line.unit,
                    line.quantity,
                    line.area,
                    line.unit_rate,
                    line.line_total
                ]);
            }
            await connection.commit();
            return newQuoteId;
        }
        catch (error) {
            await connection.rollback();
            console.error('Error duplicating quote:', error);
            throw new Error('Failed to duplicate quote in database');
        }
    }
    async updateStatus(id, status) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating quote status:', error);
            throw new Error('Failed to update quote status in database');
        }
    }
}
//# sourceMappingURL=QuoteRepository.js.map