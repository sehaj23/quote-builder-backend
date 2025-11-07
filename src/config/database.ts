import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DatabaseConfig } from '../types/index.js';

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

// Connection pool configuration
const poolConfig = {
  ...dbConfig,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  maxReconnects: 3,
  reconnectDelay: 2000,
};

// Global connection pool
let pool: mysql.Pool | null = null;

// Initialize MySQL database connection pool
export const initDatabase = async (): Promise<mysql.Pool> => {
  if (pool) return pool;
  
  try {
    console.log('🔄 Initializing database connection pool...');
    
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
    
    // Create connection pool
    pool = mysql.createPool(poolConfig);
    console.log('✅ Connected to MySQL database with connection pool');
    
    // Create tables using a connection from the pool
    await createTables();
    
    console.log('✅ MySQL database initialized successfully');
    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize MySQL database:', error);
    throw error;
  }
};

// Create database tables
const createTables = async (): Promise<void> => {
  if (!pool) return;
  
  const connection = await pool.getConnection();

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
        logo_attachment_id INT,
        default_tax DECIMAL(5,2) DEFAULT 0,
        quote_prefix VARCHAR(50) DEFAULT 'QTE',
        next_quote_number INT DEFAULT 100,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_name (name),
        INDEX idx_company_email (email),
        INDEX idx_company_logo (logo_attachment_id)
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

      // Check if currency column exists
      const [currencyColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'companies' 
          AND COLUMN_NAME = 'currency'
      `) as any[];
      
      if (currencyColumns.length === 0) {
        console.log('➕ Adding currency column to companies table...');
        await connection.execute(`
          ALTER TABLE companies 
          ADD COLUMN currency VARCHAR(10) DEFAULT 'INR' AFTER next_quote_number
        `);
        console.log('✅ Added currency column with default INR');
      } else {
        console.log('✅ currency column already exists');
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
        luxury_description TEXT,
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
        design_fee DECIMAL(12,2) DEFAULT 0,
        design_fee_type VARCHAR(20) DEFAULT 'fixed',
        handling_fee DECIMAL(12,2) DEFAULT 0,
        handling_fee_type VARCHAR(20) DEFAULT 'fixed',
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
        company_id INT NOT NULL,
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
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
        INDEX idx_line_quote (quote_id),
        INDEX idx_line_company (company_id),
        INDEX idx_line_item (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        is_super_user BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        company_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_activity TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL,
        INDEX idx_user_email (email),
        INDEX idx_user_company (company_id),
        INDEX idx_user_approved (is_approved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Attachments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_url VARCHAR(1000) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        type VARCHAR(50) DEFAULT 'document',
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL,
        INDEX idx_attachment_company (company_id),
        INDEX idx_attachment_type (type),
        INDEX idx_attachment_user (uploaded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User activity log table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(255) NOT NULL,
        company_id INT,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id INT,
        description TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL,
        INDEX idx_activity_user (user_id),
        INDEX idx_activity_company (company_id),
        INDEX idx_activity_action (action),
        INDEX idx_activity_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Migration: Add luxury_description to items if it doesn't exist
    try {
      const [luxDescColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'items' 
          AND COLUMN_NAME = 'luxury_description'
      `) as any[];
      if (luxDescColumns.length === 0) {
        console.log('➕ Adding luxury_description column to items table...');
        await connection.execute(`
          ALTER TABLE items 
          ADD COLUMN luxury_description TEXT AFTER default_description
        `);
        console.log('✅ Added luxury_description column');
      } else {
        console.log('✅ luxury_description column already exists on items table');
      }
    } catch (err) {
      console.warn('⚠️  Items table migration warning (luxury_description):', err);
    }

    // Migration: Add discount_type and fee columns to quotes table if they don't exist
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

      // Check and add design_fee
      const [designFeeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'design_fee'
      `) as any[];
      if (designFeeColumns.length === 0) {
        console.log('➕ Adding design_fee column to quotes table...');
        await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN design_fee DECIMAL(12,2) DEFAULT 0 AFTER discount_type
        `);
        console.log('✅ Added design_fee column');
      } else {
        console.log('✅ design_fee column already exists');
      }

      // Check and add design_fee_type
      const [designFeeTypeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'design_fee_type'
      `) as any[];
      if (designFeeTypeColumns.length === 0) {
        console.log('➕ Adding design_fee_type column to quotes table...');
        await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN design_fee_type VARCHAR(20) DEFAULT 'fixed' AFTER design_fee
        `);
        console.log('✅ Added design_fee_type column');
      } else {
        console.log('✅ design_fee_type column already exists');
      }

      // Check and add handling_fee
      const [handlingFeeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'handling_fee'
      `) as any[];
      if (handlingFeeColumns.length === 0) {
        console.log('➕ Adding handling_fee column to quotes table...');
        await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN handling_fee DECIMAL(12,2) DEFAULT 0 AFTER design_fee_type
        `);
        console.log('✅ Added handling_fee column');
      } else {
        console.log('✅ handling_fee column already exists');
      }

      // Check and add handling_fee_type
      const [handlingFeeTypeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'handling_fee_type'
      `) as any[];
      if (handlingFeeTypeColumns.length === 0) {
        console.log('➕ Adding handling_fee_type column to quotes table...');
        await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN handling_fee_type VARCHAR(20) DEFAULT 'fixed' AFTER handling_fee
        `);
        console.log('✅ Added handling_fee_type column');
      } else {
        console.log('✅ handling_fee_type column already exists');
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

    // Migration: Add missing auth columns to users table
    console.log('🔄 Checking for missing user table columns...');
    try {
      // Check if cognito_id column exists
      const [cognitoIdColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'cognito_id'
      `) as any[];
      
      if (cognitoIdColumns.length === 0) {
        console.log('➕ Adding cognito_id column to users table...');
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN cognito_id VARCHAR(255) AFTER email,
          ADD INDEX idx_user_cognito (cognito_id)
        `);
        console.log('✅ Added cognito_id column');
      } else {
        console.log('✅ cognito_id column already exists');
      }
      
      // Check if first_name column exists
      const [firstNameColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'first_name'
      `) as any[];
      
      if (firstNameColumns.length === 0) {
        console.log('➕ Adding first_name column to users table...');
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN first_name VARCHAR(255) AFTER name
        `);
        console.log('✅ Added first_name column');
      } else {
        console.log('✅ first_name column already exists');
      }
      
      // Check if last_name column exists
      const [lastNameColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'last_name'
      `) as any[];
      
      if (lastNameColumns.length === 0) {
        console.log('➕ Adding last_name column to users table...');
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN last_name VARCHAR(255) AFTER first_name
        `);
        console.log('✅ Added last_name column');
      } else {
        console.log('✅ last_name column already exists');
      }
      
    } catch (migrationError) {
      console.warn('⚠️  User table migration warning:', migrationError);
      // Continue with table creation even if migration fails
    }

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Get database connection pool
export const getConnection = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const pool = getConnection();
    const connection = await pool.getConnection();
    try {
      await connection.ping();
      console.log('✅ Database connection is healthy');
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Close database connection pool
export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeConnection();
  process.exit(0);
});