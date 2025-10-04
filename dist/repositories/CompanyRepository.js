import { getConnection } from '@/config/database.js';
export class CompanyRepository {
    getDbConnection() {
        return getConnection();
    }
    async findAll() {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM companies ORDER BY created_at DESC');
            return rows;
        }
        catch (error) {
            console.error('Error fetching all companies:', error);
            throw new Error('Failed to fetch companies from database');
        }
    }
    async findById(id) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM companies WHERE id = ?', [id]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0];
        }
        catch (error) {
            console.error(`Error fetching company with ID ${id}:`, error);
            throw new Error('Failed to fetch company from database');
        }
    }
    async findByEmail(email) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT * FROM companies WHERE email = ?', [email]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0];
        }
        catch (error) {
            console.error(`Error fetching company with email ${email}:`, error);
            throw new Error('Failed to fetch company from database');
        }
    }
    async create(companyData) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`INSERT INTO companies (name, address, email, phone, terms, logo_path, default_tax, quote_prefix, next_quote_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                companyData.name,
                companyData.address || null,
                companyData.email || null,
                companyData.phone || null,
                companyData.terms || null,
                companyData.logo_path || null,
                companyData.default_tax || 0,
                companyData.quote_prefix || 'QTE',
                companyData.next_quote_number || 100
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating company:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Company with this email already exists');
            }
            throw new Error('Failed to create company');
        }
    }
    async update(id, companyData) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute(`UPDATE companies 
         SET name = ?, address = ?, email = ?, phone = ?, terms = ?, logo_path = ?, default_tax = ?, quote_prefix = ?, next_quote_number = ?
         WHERE id = ?`, [
                companyData.name,
                companyData.address || null,
                companyData.email || null,
                companyData.phone || null,
                companyData.terms || null,
                companyData.logo_path || null,
                companyData.default_tax ?? null,
                companyData.quote_prefix ?? null,
                companyData.next_quote_number ?? null,
                id
            ]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error(`Error updating company with ID ${id}:`, error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Company with this email already exists');
            }
            throw new Error('Failed to update company');
        }
    }
    async delete(id) {
        try {
            const connection = this.getDbConnection();
            const [result] = await connection.execute('DELETE FROM companies WHERE id = ?', [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error(`Error deleting company with ID ${id}:`, error);
            throw new Error('Failed to delete company');
        }
    }
    async exists(id) {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT 1 FROM companies WHERE id = ? LIMIT 1', [id]);
            return rows.length > 0;
        }
        catch (error) {
            console.error(`Error checking if company ${id} exists:`, error);
            throw new Error('Failed to check company existence');
        }
    }
    async count() {
        try {
            const connection = this.getDbConnection();
            const [rows] = await connection.execute('SELECT COUNT(*) as count FROM companies');
            return rows[0].count;
        }
        catch (error) {
            console.error('Error counting companies:', error);
            throw new Error('Failed to count companies');
        }
    }
}
//# sourceMappingURL=CompanyRepository.js.map