import { getConnection } from '@/config/database.js';
export class ItemRepository {
    getDbConnection() {
        return getConnection();
    }
    async findByCompanyId(companyId) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM items WHERE company_id = ? ORDER BY category ASC, name ASC', [companyId]);
            return rows;
        }
        catch (error) {
            console.error('Error fetching items for company:', error);
            throw new Error('Failed to fetch items from database');
        }
    }
    async findById(id) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM items WHERE id = ?', [id]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0];
        }
        catch (error) {
            console.error('Error fetching item by ID:', error);
            throw new Error('Failed to fetch item from database');
        }
    }
    async create(itemData) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`INSERT INTO items (
          company_id, name, default_description, unit, default_area, 
          unit_cost, economy_unit_cost, luxury_unit_cost, tags, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating item:', error);
            throw new Error('Failed to create item in database');
        }
    }
    async update(id, itemData) {
        try {
            const connection = this.getDbConnection();
            const updates = [];
            const values = [];
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
                return false;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const query = `UPDATE items SET ${updates.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(query, values);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating item:', error);
            throw new Error('Failed to update item in database');
        }
    }
    async delete(id) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute('DELETE FROM items WHERE id = ?', [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error deleting item:', error);
            throw new Error('Failed to delete item from database');
        }
    }
    async search(companyId, query) {
        try {
            const connection = this.getDbConnection();
            const searchTerm = `%${query}%`;
            const [rows] = await connection.execute(`SELECT * FROM items 
         WHERE company_id = ? 
         AND (name LIKE ? OR default_description LIKE ? OR tags LIKE ? OR category LIKE ?)
         ORDER BY category ASC, name ASC`, [companyId, searchTerm, searchTerm, searchTerm, searchTerm]);
            return rows;
        }
        catch (error) {
            console.error('Error searching items:', error);
            throw new Error('Failed to search items in database');
        }
    }
    async findByCategory(companyId, category) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM items WHERE company_id = ? AND category = ? ORDER BY name ASC', [companyId, category]);
            return rows;
        }
        catch (error) {
            console.error('Error fetching items by category:', error);
            throw new Error('Failed to fetch items by category from database');
        }
    }
    async getCategories(companyId) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT DISTINCT category FROM items WHERE company_id = ? AND category IS NOT NULL ORDER BY category ASC', [companyId]);
            return rows.map(row => row['category']);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories from database');
        }
    }
}
//# sourceMappingURL=ItemRepository.js.map