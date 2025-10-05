import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection } from '../config/database.js';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types/index.js';

export class CompanyRepository {
  private getDbConnection() {
    return getConnection();
  }

  async findAll(): Promise<Company[]> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM companies ORDER BY created_at DESC'
      );
      return rows as Company[];
    } catch (error) {
      console.error('Error fetching all companies:', error);
      throw new Error('Failed to fetch companies from database');
    }
  }

  async findById(id: number): Promise<Company | null> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM companies WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as Company;
    } catch (error) {
      console.error(`Error fetching company with ID ${id}:`, error);
      throw new Error('Failed to fetch company from database');
    }
  }

  async findByEmail(email: string): Promise<Company | null> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM companies WHERE email = ?',
        [email]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as Company;
    } catch (error) {
      console.error(`Error fetching company with email ${email}:`, error);
      throw new Error('Failed to fetch company from database');
    }
  }

  async create(companyData: CreateCompanyRequest): Promise<number> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO companies (name, address, email, phone, terms, logo_path, default_tax, quote_prefix, next_quote_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyData.name,
          companyData.address || null,
          companyData.email || null,
          companyData.phone || null,
          companyData.terms || null,
          companyData.logo_path || null,
          companyData.default_tax || 0,
          companyData.quote_prefix || 'QTE',
          companyData.next_quote_number || 100
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating company:', error);
      if ((error as any).code === 'ER_DUP_ENTRY') {
        throw new Error('Company with this email already exists');
      }
      throw new Error('Failed to create company');
    }
  }

  async update(id: number, companyData: UpdateCompanyRequest): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE companies 
         SET name = ?, address = ?, email = ?, phone = ?, terms = ?, logo_path = ?, default_tax = ?, quote_prefix = ?, next_quote_number = ?
         WHERE id = ?`,
        [
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
        ]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating company with ID ${id}:`, error);
      if ((error as any).code === 'ER_DUP_ENTRY') {
        throw new Error('Company with this email already exists');
      }
      throw new Error('Failed to update company');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM companies WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting company with ID ${id}:`, error);
      throw new Error('Failed to delete company');
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT 1 FROM companies WHERE id = ? LIMIT 1',
        [id]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error(`Error checking if company ${id} exists:`, error);
      throw new Error('Failed to check company existence');
    }
  }

  async count(): Promise<number> {
    try {
      const connection = this.getDbConnection();
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM companies'
      );
      
      return (rows[0] as any).count;
    } catch (error) {
      console.error('Error counting companies:', error);
      throw new Error('Failed to count companies');
    }
  }
}