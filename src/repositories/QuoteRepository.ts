import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection } from '@/config/database.js';
import { Quote, QuoteLine, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '@/types/index.js';

export class QuoteRepository {
  private getDbConnection() {
    return getConnection();
  }

  async findByCompanyId(companyId: number, limit?: number, offset?: number): Promise<Quote[]> {
    try {
      const connection = this.getDbConnection();
      let query = 'SELECT * FROM quotes WHERE company_id = ? ORDER BY created_at DESC';
      const params: any[] = [companyId];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return rows as Quote[];
    } catch (error) {
      console.error('Error fetching quotes for company:', error);
      throw new Error('Failed to fetch quotes from database');
    }
  }

  async findById(id: number): Promise<Quote | null> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM quotes WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as Quote;
    } catch (error) {
      console.error('Error fetching quote by ID:', error);
      throw new Error('Failed to fetch quote from database');
    }
  }

  async findByIdWithLines(id: number): Promise<QuoteWithLines | null> {
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
    } catch (error) {
      console.error('Error fetching quote with lines:', error);
      throw new Error('Failed to fetch quote with lines from database');
    }
  }

  async getQuoteLines(quoteId: number): Promise<QuoteLine[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY id ASC',
        [quoteId]
      );
      return rows as QuoteLine[];
    } catch (error) {
      console.error('Error fetching quote lines:', error);
      throw new Error('Failed to fetch quote lines from database');
    }
  }

  async create(quoteData: CreateQuoteRequest): Promise<number> {
    const connection = this.getDbConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Insert quote
      const [quoteResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO quotes (
          company_id, quote_number, project_name, customer_name, customer_email, 
          customer_mobile, tier, status, subtotal, tax, discount, discount_type, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
          quoteData.discount_type || 'fixed',
          quoteData.total || 0
        ]
      );

      const quoteId = quoteResult.insertId;

      // Insert quote lines if provided
      if (quoteData.lines && quoteData.lines.length > 0) {
        for (const line of quoteData.lines) {
          await connection.execute<ResultSetHeader>(
            `INSERT INTO quote_lines (
              quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quoteId,
              line.item_id || null,
              line.description || null,
              line.unit || null,
              line.quantity || 1,
              line.area || 1,
              line.unit_rate || 0,
              line.line_total || 0
            ]
          );
        }
      }

      // Commit transaction
      await connection.commit();
      return quoteId;
    } catch (error) {
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        sqlState: (error as any)?.sqlState,
        sqlMessage: (error as any)?.sqlMessage
      });
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error creating quote:', error);
      throw new Error('Failed to create quote in database');
    }
  }

  async update(id: number, quoteData: UpdateQuoteRequest): Promise<boolean> {
    const connection = this.getDbConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Build dynamic update query for quote
      const updates: string[] = [];
      const values: any[] = [];
      
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
      if (quoteData.discount_type !== undefined) {
        updates.push('discount_type = ?');
        values.push(quoteData.discount_type);
      }
      if (quoteData.total !== undefined) {
        updates.push('total = ?');
        values.push(quoteData.total);
      }
      
      if (updates.length > 0) {
        // Add updated_at timestamp
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id); // for WHERE clause
        
        const query = `UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`;
        await connection.execute<ResultSetHeader>(query, values);
      }

      // Update quote lines if provided
      if (quoteData.lines !== undefined) {
        // Delete existing lines
        await connection.execute<ResultSetHeader>(
          'DELETE FROM quote_lines WHERE quote_id = ?',
          [id]
        );

        // Insert new lines
        if (quoteData.lines.length > 0) {
          for (const line of quoteData.lines) {
            await connection.execute<ResultSetHeader>(
              `INSERT INTO quote_lines (
                quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                line.item_id || null,
                line.description || null,
                line.unit || null,
                line.quantity || 1,
                line.area || 1,
                line.unit_rate || 0,
                line.line_total || 0
              ]
            );
          }
        }
      }

      // Commit transaction
      await connection.commit();
      return true;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote in database');
    }
  }

  async delete(id: number): Promise<boolean> {
    const connection = this.getDbConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Delete quote lines first (foreign key constraint)
      await connection.execute<ResultSetHeader>(
        'DELETE FROM quote_lines WHERE quote_id = ?',
        [id]
      );

      // Delete quote
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM quotes WHERE id = ?',
        [id]
      );

      // Commit transaction
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote from database');
    }
  }

  async search(companyId: number, query: string): Promise<Quote[]> {
    try {
      const connection = this.getDbConnection();
      const searchTerm = `%${query}%`;
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM quotes 
         WHERE company_id = ? 
         AND (quote_number LIKE ? OR customer_name LIKE ? OR project_name LIKE ?)
         ORDER BY created_at DESC`,
        [companyId, searchTerm, searchTerm, searchTerm]
      );
      return rows as Quote[];
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw new Error('Failed to search quotes in database');
    }
  }

  async duplicate(id: number, newQuoteNumber: string, newTier?: string): Promise<number> {
    const connection = this.getDbConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Get original quote
      const originalQuote = await this.findById(id);
      if (!originalQuote) {
        throw new Error('Original quote not found');
      }

      // Get original quote lines
      const originalLines = await this.getQuoteLines(id);

      // If tier is changing, we need to recalculate prices
      let newSubtotal = originalQuote.subtotal || 0;
      let newTotal = originalQuote.total || 0;
      let adjustedLines = [...originalLines];

      if (newTier && newTier !== originalQuote.tier) {
        console.log(`Recalculating prices for tier change: ${originalQuote.tier} → ${newTier}`);
        
        // Get items to recalculate prices
        newSubtotal = 0;
        adjustedLines = [];

        for (const line of originalLines) {
          if (line.item_id) {
            // Get item details to recalculate price based on new tier
            const [itemRows] = await connection.execute<RowDataPacket[]>(
              'SELECT * FROM items WHERE id = ?',
              [line.item_id]
            );
            
            if (itemRows.length > 0) {
              const item = itemRows[0];
              let newUnitRate = line.unit_rate; // fallback to original rate
              
              // Calculate new unit rate based on tier
              if (newTier === 'luxury') {
                newUnitRate = item.luxury_unit_cost || item.unit_cost || line.unit_rate;
              } else if (newTier === 'economy') {
                newUnitRate = item.economy_unit_cost || item.unit_cost || line.unit_rate;
              }
              
              // Recalculate line total
              const areaMultiplier = line.area && line.area > 0 ? line.area : 1;
              const newLineTotal = Math.round((line.quantity || 1) * newUnitRate * areaMultiplier * 100) / 100;
              
              adjustedLines.push({
                ...line,
                unit_rate: newUnitRate,
                line_total: newLineTotal
              });
              
              newSubtotal += newLineTotal;
              
              console.log(`Item ${item.name}: ${line.unit_rate} → ${newUnitRate} (${line.line_total} → ${newLineTotal})`);
            } else {
              // Item not found, keep original values
              adjustedLines.push(line);
              newSubtotal += line.line_total || 0;
            }
          } else {
            // Line without item_id, keep original values
            adjustedLines.push(line);
            newSubtotal += line.line_total || 0;
          }
        }
        
        // Recalculate total with tax and discount
        const tax = originalQuote.tax || 0;
        const discount = originalQuote.discount || 0;
        newTotal = Math.round((newSubtotal + tax - discount) * 100) / 100;
        newSubtotal = Math.round(newSubtotal * 100) / 100;
        
        console.log(`Total recalculated: ${originalQuote.total} → ${newTotal} (subtotal: ${newSubtotal})`);
      }

      // Create new quote with recalculated values
      // Check if discount_type column exists by trying to get it from original quote
      let includeDiscountType = false;
      try {
        // Test if discount_type exists by checking if originalQuote has this property
        const testQuery = 'SELECT discount_type FROM quotes WHERE id = ? LIMIT 1';
        await connection.execute(testQuery, [id]);
        includeDiscountType = true;
        console.log('discount_type column exists, including in INSERT');
      } catch (e) {
        console.log('discount_type column does not exist, excluding from INSERT');
        includeDiscountType = false;
      }

      let quoteResult;
      if (includeDiscountType) {
        [quoteResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO quotes (
            company_id, quote_number, project_name, customer_name, customer_email, 
            customer_mobile, tier, status, subtotal, tax, discount, discount_type, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            originalQuote.company_id,
            newQuoteNumber,
            originalQuote.project_name,
            originalQuote.customer_name,
            originalQuote.customer_email,
            originalQuote.customer_mobile,
            newTier || originalQuote.tier,
            'draft', // Always start as draft
            newSubtotal,
            originalQuote.tax,
            originalQuote.discount,
            originalQuote.discount_type || 'fixed',
            newTotal
          ]
        );
      } else {
        [quoteResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO quotes (
            company_id, quote_number, project_name, customer_name, customer_email, 
            customer_mobile, tier, status, subtotal, tax, discount, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            originalQuote.company_id,
            newQuoteNumber,
            originalQuote.project_name,
            originalQuote.customer_name,
            originalQuote.customer_email,
            originalQuote.customer_mobile,
            newTier || originalQuote.tier,
            'draft', // Always start as draft
            newSubtotal,
            originalQuote.tax,
            originalQuote.discount,
            newTotal
          ]
        );
      }

      const newQuoteId = quoteResult.insertId;

      // Duplicate quote lines with adjusted prices
      for (const line of adjustedLines) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO quote_lines (
            quote_id, item_id, description, unit, quantity, area, unit_rate, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newQuoteId,
            line.item_id,
            line.description,
            line.unit,
            line.quantity,
            line.area,
            line.unit_rate,
            line.line_total
          ]
        );
      }

      // Commit transaction
      await connection.commit();
      return newQuoteId;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error duplicating quote:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        sqlState: (error as any)?.sqlState,
        sqlMessage: (error as any)?.sqlMessage
      });
      throw error; // Throw original error instead of generic message
    }
  }

  async findByCompanyAndQuoteNumber(companyId: number, quoteNumber: string): Promise<Quote | null> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM quotes WHERE company_id = ? AND quote_number = ? LIMIT 1',
        [companyId, quoteNumber]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as Quote;
    } catch (error) {
      console.error('Error finding quote by company and quote number:', error);
      throw new Error('Failed to find quote by company and quote number in database');
    }
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw new Error('Failed to update quote status in database');
    }
  }
}