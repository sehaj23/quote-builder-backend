import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DatabaseConfig } from '@/types/index.js';

dotenv.config();

// MySQL database configuration
export const dbConfig: DatabaseConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  user: process.env['DB_USER'] || 'root',
  password: process.env['DB_PASSWORD'] || 'dl4cl0621',
  database: process.env['DB_NAME'] || 'quotebuilder_web',
  port: parseInt(process.env['DB_PORT'] || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Global connection variable
let connection: mysql.Connection | null = null;

// Initialize MySQL database connection
export const initDatabase = async (): Promise<mysql.Connection> => {
  if (connection) return connection;
  
  try {
    console.log('🔄 Initializing database connection...');
    
    // First connect without database to create it if needed
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      charset: 'utf8mb4'
    });
    
    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' ensured to exist`);
    await tempConnection.end();
    
    // Now connect to the specific database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Create tables
    await createTables();
    
    console.log('✅ MySQL database initialized successfully');
    return connection;
  } catch (error) {
    console.error('❌ Failed to initialize MySQL database:', error);
    throw error;
  }
};

// Create database tables
const createTables = async (): Promise<void> => {
  if (!connection) return;

  try {
    console.log('🔄 Creating database tables...');

    // Companies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        terms TEXT,
        logo_path VARCHAR(500),
        default_tax DECIMAL(5,2) DEFAULT 0,
        quote_prefix VARCHAR(50) DEFAULT 'QTE',
        next_quote_number INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_name (name),
        INDEX idx_company_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migration: Add quote_prefix and next_quote_number columns if they don't exist
    console.log('🔄 Checking for missing company table columns...');
    try {
      // Check if quote_prefix column exists
      const [prefixColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'companies' 
          AND COLUMN_NAME = 'quote_prefix'
      `) as any[];
      
      if (prefixColumns.length === 0) {
        console.log('➕ Adding quote_prefix column to companies table...');
        await connection.execute(`
          ALTER TABLE companies 
          ADD COLUMN quote_prefix VARCHAR(50) DEFAULT 'QTE' AFTER default_tax
        `);
        console.log('✅ Added quote_prefix column');
      } else {
        console.log('✅ quote_prefix column already exists');
      }
      
      // Check if next_quote_number column exists
      const [numberColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'companies' 
          AND COLUMN_NAME = 'next_quote_number'
      `) as any[];
      
      if (numberColumns.length === 0) {
        console.log('➕ Adding next_quote_number column to companies table...');
        await connection.execute(`
          ALTER TABLE companies 
          ADD COLUMN next_quote_number INT DEFAULT 100 AFTER quote_prefix
        `);
        console.log('✅ Added next_quote_number column');
      } else {
        console.log('✅ next_quote_number column already exists');
      }
    } catch (migrationError) {
      console.warn('⚠️  Migration warning:', migrationError);
      // Continue with table creation even if migration fails
    }
    
    // Items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        default_description TEXT,
        unit VARCHAR(50) NOT NULL,
        default_area DECIMAL(10,2) DEFAULT 1,
        unit_cost DECIMAL(10,2) NOT NULL,
        economy_unit_cost DECIMAL(10,2),
        luxury_unit_cost DECIMAL(10,2),
        tags TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        INDEX idx_item_company (company_id),
        INDEX idx_item_name (name),
        INDEX idx_item_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Quotes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        quote_number VARCHAR(100) NOT NULL,
        project_name VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_mobile VARCHAR(50),
        tier VARCHAR(50) DEFAULT 'standard',
        status VARCHAR(50) DEFAULT 'draft',
        subtotal DECIMAL(12,2) DEFAULT 0,
        tax DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        discount_type VARCHAR(20) DEFAULT 'fixed',
        total DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        UNIQUE KEY unique_quote_number (company_id, quote_number),
        INDEX idx_quote_company (company_id),
        INDEX idx_quote_status (status),
        INDEX idx_quote_customer (customer_name),
        INDEX idx_quote_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Quote lines table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quote_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        quote_id INT NOT NULL,
        item_id INT NOT NULL,
        description TEXT,
        unit VARCHAR(50),
        quantity DECIMAL(10,2) DEFAULT 1,
        area DECIMAL(10,2) DEFAULT 1,
        unit_rate DECIMAL(10,2),
        line_total DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
        INDEX idx_line_quote (quote_id),
        INDEX idx_line_item (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Migration: Add discount_type column to quotes table if it doesn't exist
    console.log('🔄 Checking for missing quote table columns...');
    try {
      // Check if discount_type column exists
      const [discountTypeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'discount_type'
      `) as any[];
      
      if (discountTypeColumns.length === 0) {
        console.log('➕ Adding discount_type column to quotes table...');
        await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed' AFTER discount
        `);
        console.log('✅ Added discount_type column');
      } else {
        console.log('✅ discount_type column already exists');
      }
    } catch (migrationError) {
      console.warn('⚠️  Quote table migration warning:', migrationError);
      // Continue with table creation even if migration fails
    }

    // Add default_tax column if it doesn't exist (migration)
    try {
      await connection.execute(`
        ALTER TABLE companies 
        ADD COLUMN default_tax DECIMAL(5,2) DEFAULT 0
      `);
    } catch (error: any) {
      // Ignore error if column already exists
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  }
};

// Get database connection
export const getConnection = (): mysql.Connection => {
  if (!connection) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return connection;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const conn = getConnection();
    await conn.ping();
    console.log('✅ Database connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  if (connection) {
    await connection.end();
    connection = null;
    console.log('✅ Database connection closed');
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeConnection();
  process.exit(0);
});