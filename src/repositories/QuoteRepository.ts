import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection } from '../config/database.js';
import { Quote, QuoteLine, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '../types/index.js';

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

  async findByCompanyIdPaginated(
    companyId: number, 
    limit: number, 
    offset: number, 
    filters: { search?: string; status?: string; tier?: string }
  ): Promise<Quote[]> {
    try {
      const connection = this.getDbConnection();
      let query = 'SELECT * FROM quotes WHERE company_id = ?';
      const params: any[] = [companyId];

      // Add search filter
      if (filters.search && filters.search.trim()) {
        query += ' AND (quote_number LIKE ? OR customer_name LIKE ? OR project_name LIKE ? OR customer_email LIKE ?)';
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Add status filter
      if (filters.status && filters.status.trim()) {
        query += ' AND status = ?';
        params.push(filters.status.trim());
      }

      // Add tier filter
      if (filters.tier && filters.tier.trim()) {
        query += ' AND tier = ?';
        params.push(filters.tier.trim());
      }

      // Ensure limit and offset are valid integers
      const limitInt = parseInt(String(limit)) || 10;
      const offsetInt = parseInt(String(offset)) || 0;
      
      // Use string interpolation for LIMIT/OFFSET instead of prepared statements
      // This avoids MySQL parameter binding issues with LIMIT/OFFSET
      query += ` ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return rows as Quote[];
    } catch (error) {
      console.error('Error fetching paginated quotes for company:', error);
      throw new Error('Failed to fetch paginated quotes from database');
    }
  }

  async countByCompanyId(
    companyId: number, 
    filters: { search?: string; status?: string; tier?: string }
  ): Promise<number> {
    try {
      const connection = this.getDbConnection();
      let query = 'SELECT COUNT(*) as count FROM quotes WHERE company_id = ?';
      const params: any[] = [companyId];

      // Add search filter
      if (filters.search && filters.search.trim()) {
        query += ' AND (quote_number LIKE ? OR customer_name LIKE ? OR project_name LIKE ? OR customer_email LIKE ?)';
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Add status filter
      if (filters.status && filters.status.trim()) {
        query += ' AND status = ?';
        params.push(filters.status.trim());
      }

      // Add tier filter
      if (filters.tier && filters.tier.trim()) {
        query += ' AND tier = ?';
        params.push(filters.tier.trim());
      }
      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return (rows as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Error counting quotes for company:', error);
      throw new Error('Failed to count quotes from database');
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
    const pool = this.getDbConnection();
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Insert quote
      const [quoteResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO quotes (
          company_id, quote_number, project_name, customer_name, customer_email, 
          customer_mobile, tier, status, subtotal, tax, discount, discount_type, 
          design_fee, design_fee_type, handling_fee, handling_fee_type, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          quoteData.design_fee || 0,
          quoteData.design_fee_type || 'fixed',
          quoteData.handling_fee || 0,
          quoteData.handling_fee_type || 'fixed',
          quoteData.total || 0
        ]
      );

      const quoteId = quoteResult.insertId;
      const quoteTier = quoteData.tier || 'economy';

      // Insert quote lines if provided
      if (quoteData.lines && quoteData.lines.length > 0) {
        for (const line of quoteData.lines) {
          let finalDescription = line.description || null;
          if ((!finalDescription || String(finalDescription).trim().length === 0) && line.item_id) {
            const [itemRows] = await connection.execute<RowDataPacket[]>(
              'SELECT default_description, luxury_description FROM items WHERE id = ? LIMIT 1',
              [line.item_id]
            );
            if (itemRows.length > 0) {
              const item = itemRows[0] as any;
              const candidate = quoteTier === 'luxury' ? (item['luxury_description'] || item['default_description']) : (item['default_description'] || item['luxury_description']);
              finalDescription = candidate || null;
            }
          }

          await connection.execute<ResultSetHeader>(
            `INSERT INTO quote_lines (
              quote_id, company_id, item_id, description, unit, quantity, area, unit_rate, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quoteId,
              quoteData.company_id,
              line.item_id || null,
              finalDescription,
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
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  }

  async update(id: number, quoteData: UpdateQuoteRequest): Promise<boolean> {
    const pool = this.getDbConnection();
    const connection = await pool.getConnection();
    
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
      if (quoteData.design_fee !== undefined) {
        updates.push('design_fee = ?');
        values.push(quoteData.design_fee);
      }
      if (quoteData.design_fee_type !== undefined) {
        updates.push('design_fee_type = ?');
        values.push(quoteData.design_fee_type);
      }
      if (quoteData.handling_fee !== undefined) {
        updates.push('handling_fee = ?');
        values.push(quoteData.handling_fee);
      }
      if (quoteData.handling_fee_type !== undefined) {
        updates.push('handling_fee_type = ?');
        values.push(quoteData.handling_fee_type);
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
        // Get company_id from existing quote
        const [quoteRows] = await connection.execute<RowDataPacket[]>(
          'SELECT company_id, tier FROM quotes WHERE id = ?',
          [id]
        );
        
        if (quoteRows.length === 0) {
          throw new Error('Quote not found');
        }
        
        const companyId = quoteRows[0]?.company_id;
        const quoteTier = quoteRows[0]?.tier || 'economy';
        
        // Delete existing lines
        await connection.execute<ResultSetHeader>(
          'DELETE FROM quote_lines WHERE quote_id = ?',
          [id]
        );

        // Insert new lines
        if (quoteData.lines.length > 0) {
          for (const line of quoteData.lines) {
            let finalDescription = line.description || null;
            if ((!finalDescription || String(finalDescription).trim().length === 0) && line.item_id) {
              const [itemRows] = await connection.execute<RowDataPacket[]>(
                'SELECT default_description, luxury_description FROM items WHERE id = ? LIMIT 1',
                [line.item_id]
              );
              if (itemRows.length > 0) {
                const item = itemRows[0] as any;
                const candidate = quoteTier === 'luxury' ? (item['luxury_description'] || item['default_description']) : (item['default_description'] || item['luxury_description']);
                finalDescription = candidate || null;
              }
            }

            await connection.execute<ResultSetHeader>(
              `INSERT INTO quote_lines (
                quote_id, company_id, item_id, description, unit, quantity, area, unit_rate, line_total
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                companyId,
                line.item_id || null,
                finalDescription,
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
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const pool = this.getDbConnection();
    const connection = await pool.getConnection();
    
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
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  }

  async search(companyId: number, query: string): Promise<Quote[]> {
    try {
      const connection = this.getDbConnection();
      const searchTerm = `%${query}%`;
      console.log('Search term:', searchTerm);
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
    const pool = this.getDbConnection();
    const connection = await pool.getConnection();
    
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
              const item = itemRows[0] as any;
              let newUnitRate = line.unit_rate; // fallback to original rate
              let newDescription = line.description; // default to existing description
              
              // Calculate new unit rate based on tier
              if (item && newTier === 'luxury') {
                newUnitRate = item['luxury_unit_cost'] || item['unit_cost'] || line.unit_rate;
                // Prefer luxury description for luxury tier
                newDescription = item['luxury_description'] || item['default_description'] || line.description;
              } else if (item && newTier === 'economy') {
                newUnitRate = item['economy_unit_cost'] || item['unit_cost'] || line.unit_rate;
                // Prefer default description for non-luxury tiers
                newDescription = item['default_description'] || item['luxury_description'] || line.description;
              } else {
                // For standard or unspecified tier, prefer default description
                newDescription = item['default_description'] || item['luxury_description'] || line.description;
              }
              
              // Recalculate line total
              const areaMultiplier = line.area && line.area > 0 ? line.area : 1;
              const newLineTotal = Math.round((line.quantity || 1) * (newUnitRate || 0) * areaMultiplier * 100) / 100;
              
              const updatedLine: any = {
                ...line,
                unit_rate: newUnitRate || 0,
                line_total: newLineTotal
              };
              if (newDescription && String(newDescription).trim().length > 0) {
                updatedLine.description = newDescription;
              }
              adjustedLines.push(updatedLine);
              
              newSubtotal += newLineTotal;
              
              console.log(`Item ${item ? item['name'] : 'Unknown'}: ${line.unit_rate} → ${newUnitRate} (${line.line_total} → ${newLineTotal})`);
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
        
        // Recalculate total with tax, discount, and fees
        const tax = originalQuote.tax || 0;
        const discount = originalQuote.discount || 0;
        const designFeeRaw = (originalQuote as any).design_fee || 0;
        const designFeeType = (originalQuote as any).design_fee_type || 'fixed';
        const handlingFeeRaw = (originalQuote as any).handling_fee || 0;
        const handlingFeeType = (originalQuote as any).handling_fee_type || 'fixed';

        const designFee = designFeeRaw > 0 && designFeeType === 'percentage' ? (newSubtotal * designFeeRaw) / 100 : designFeeRaw;
        const handlingFee = handlingFeeRaw > 0 && handlingFeeType === 'percentage' ? (newSubtotal * handlingFeeRaw) / 100 : handlingFeeRaw;

        newTotal = Math.round((newSubtotal + tax + designFee + handlingFee - discount) * 100) / 100;
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
            customer_mobile, tier, status, subtotal, tax, discount, discount_type, 
            design_fee, design_fee_type, handling_fee, handling_fee_type, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            (originalQuote as any).design_fee || 0,
            (originalQuote as any).design_fee_type || 'fixed',
            (originalQuote as any).handling_fee || 0,
            (originalQuote as any).handling_fee_type || 'fixed',
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
            quote_id, company_id, item_id, description, unit, quantity, area, unit_rate, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newQuoteId,
            originalQuote.company_id,
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
    } finally {
      // Always release the connection back to the pool
      connection.release();
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