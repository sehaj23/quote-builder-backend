import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection } from '@/config/database.js';
import { Item, CreateItemRequest, UpdateItemRequest } from '@/types/index.js';

export class ItemRepository {
  private getDbConnection() {
    return getConnection();
  }

  async findByCompanyId(companyId: number): Promise<Item[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM items WHERE company_id = ? ORDER BY category ASC, name ASC',
        [companyId]
      );
      return rows as Item[];
    } catch (error) {
      console.error('Error fetching items for company:', error);
      throw new Error('Failed to fetch items from database');
    }
  }

  async findByCompanyIdPaginated(
    companyId: number, 
    limit: number, 
    offset: number, 
    filters: { search?: string; category?: string }
  ): Promise<Item[]> {
    try {
      const connection = this.getDbConnection();
      let query = 'SELECT * FROM items WHERE company_id = ?';
      const params: any[] = [companyId];

      // Add search filter
      if (filters.search && filters.search.trim()) {
        query += ' AND (name LIKE ? OR default_description LIKE ? OR category LIKE ?)';
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Add category filter
      if (filters.category && filters.category.trim()) {
        query += ' AND category = ?';
        params.push(filters.category.trim());
      }

      // Ensure limit and offset are valid integers
      const limitInt = parseInt(String(limit)) || 10;
      const offsetInt = parseInt(String(offset)) || 0;
      
      // Use string interpolation for LIMIT/OFFSET instead of prepared statements
      query += ` ORDER BY category ASC, name ASC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return rows as Item[];
    } catch (error) {
      console.error('Error fetching paginated items for company:', error);
      throw new Error('Failed to fetch paginated items from database');
    }
  }

  async countByCompanyId(
    companyId: number, 
    filters: { search?: string; category?: string }
  ): Promise<number> {
    try {
      const connection = this.getDbConnection();
      let query = 'SELECT COUNT(*) as count FROM items WHERE company_id = ?';
      const params: any[] = [companyId];

      // Add search filter
      if (filters.search && filters.search.trim()) {
        query += ' AND (name LIKE ? OR default_description LIKE ? OR category LIKE ?)';
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Add category filter
      if (filters.category && filters.category.trim()) {
        query += ' AND category = ?';
        params.push(filters.category.trim());
      }

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return (rows as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Error counting items for company:', error);
      throw new Error('Failed to count items from database');
    }
  }

  async findById(id: number): Promise<Item | null> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM items WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as Item;
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      throw new Error('Failed to fetch item from database');
    }
  }

  async create(itemData: CreateItemRequest): Promise<number> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO items (
          company_id, name, default_description, unit, default_area, 
          unit_cost, economy_unit_cost, luxury_unit_cost, tags, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemData.company_id,
          itemData.name,
          itemData.default_description || null,
          itemData.unit,
          itemData.default_area || null,
          itemData.unit_cost,
          itemData.economy_unit_cost || itemData.unit_cost,
          itemData.luxury_unit_cost || itemData.unit_cost,
          itemData.tags || null,
          itemData.category || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error('Failed to create item in database');
    }
  }

  async update(id: number, itemData: UpdateItemRequest): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      
      if (itemData.name !== undefined) {
        updates.push('name = ?');
        values.push(itemData.name);
      }
      if (itemData.default_description !== undefined) {
        updates.push('default_description = ?');
        values.push(itemData.default_description);
      }
      if (itemData.unit !== undefined) {
        updates.push('unit = ?');
        values.push(itemData.unit);
      }
      if (itemData.default_area !== undefined) {
        updates.push('default_area = ?');
        values.push(itemData.default_area);
      }
      if (itemData.unit_cost !== undefined) {
        updates.push('unit_cost = ?');
        values.push(itemData.unit_cost);
      }
      if (itemData.economy_unit_cost !== undefined) {
        updates.push('economy_unit_cost = ?');
        values.push(itemData.economy_unit_cost);
      }
      if (itemData.luxury_unit_cost !== undefined) {
        updates.push('luxury_unit_cost = ?');
        values.push(itemData.luxury_unit_cost);
      }
      if (itemData.tags !== undefined) {
        updates.push('tags = ?');
        values.push(itemData.tags);
      }
      if (itemData.category !== undefined) {
        updates.push('category = ?');
        values.push(itemData.category);
      }
      
      if (updates.length === 0) {
        return false; // No updates to perform
      }
      
      // Add updated_at timestamp
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id); // for WHERE clause
      
      const query = `UPDATE items SET ${updates.join(', ')} WHERE id = ?`;
      const [result] = await connection.execute<ResultSetHeader>(query, values);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update item in database');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM items WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item from database');
    }
  }

  async search(companyId: number, query: string): Promise<Item[]> {
    try {
      const connection = this.getDbConnection();
      const searchTerm = `%${query}%`;
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM items 
         WHERE company_id = ? 
         AND (name LIKE ? OR default_description LIKE ? OR tags LIKE ? OR category LIKE ?)
         ORDER BY category ASC, name ASC`,
        [companyId, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      return rows as Item[];
    } catch (error) {
      console.error('Error searching items:', error);
      throw new Error('Failed to search items in database');
    }
  }

  async findByCategory(companyId: number, category: string): Promise<Item[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM items WHERE company_id = ? AND category = ? ORDER BY name ASC',
        [companyId, category]
      );
      return rows as Item[];
    } catch (error) {
      console.error('Error fetching items by category:', error);
      throw new Error('Failed to fetch items by category from database');
    }
  }

  async getCategories(companyId: number): Promise<string[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT DISTINCT category FROM items WHERE company_id = ? AND category IS NOT NULL ORDER BY category ASC',
        [companyId]
      );
      return rows.map(row => row['category'] as string);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories from database');
    }
  }
}