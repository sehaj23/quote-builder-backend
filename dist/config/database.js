import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
export const dbConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || 'dl4cl0621',
    database: process.env['DB_NAME'] || 'quotebuilder_web',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    charset: 'utf8mb4',
    timezone: '+00:00'
};
let connection = null;
export const initDatabase = async () => {
    if (connection)
        return connection;
    try {
        console.log('🔄 Initializing database connection...');
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            charset: 'utf8mb4'
        });
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${dbConfig.database}' ensured to exist`);
        await tempConnection.end();
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        await createTables();
        console.log('✅ MySQL database initialized successfully');
        return connection;
    }
    catch (error) {
        console.error('❌ Failed to initialize MySQL database:', error);
        throw error;
    }
};
const createTables = async () => {
    if (!connection)
        return;
    try {
        console.log('🔄 Creating database tables...');
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_name (name),
        INDEX idx_company_email (email),
        INDEX idx_company_logo (logo_attachment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('🔄 Checking for missing company table columns...');
        try {
            const [prefixColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'companies' 
          AND COLUMN_NAME = 'quote_prefix'
      `);
            if (prefixColumns.length === 0) {
                console.log('➕ Adding quote_prefix column to companies table...');
                await connection.execute(`
          ALTER TABLE companies 
          ADD COLUMN quote_prefix VARCHAR(50) DEFAULT 'QTE' AFTER default_tax
        `);
                console.log('✅ Added quote_prefix column');
            }
            else {
                console.log('✅ quote_prefix column already exists');
            }
            const [numberColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'companies' 
          AND COLUMN_NAME = 'next_quote_number'
      `);
            if (numberColumns.length === 0) {
                console.log('➕ Adding next_quote_number column to companies table...');
                await connection.execute(`
          ALTER TABLE companies 
          ADD COLUMN next_quote_number INT DEFAULT 100 AFTER quote_prefix
        `);
                console.log('✅ Added next_quote_number column');
            }
            else {
                console.log('✅ next_quote_number column already exists');
            }
        }
        catch (migrationError) {
            console.warn('⚠️  Migration warning:', migrationError);
        }
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
        console.log('🔄 Checking for missing quote table columns...');
        try {
            const [discountTypeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'quotes' 
          AND COLUMN_NAME = 'discount_type'
      `);
            if (discountTypeColumns.length === 0) {
                console.log('➕ Adding discount_type column to quotes table...');
                await connection.execute(`
          ALTER TABLE quotes 
          ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed' AFTER discount
        `);
                console.log('✅ Added discount_type column');
            }
            else {
                console.log('✅ discount_type column already exists');
            }
        }
        catch (migrationError) {
            console.warn('⚠️  Quote table migration warning:', migrationError);
        }
        try {
            await connection.execute(`
        ALTER TABLE companies 
        ADD COLUMN default_tax DECIMAL(5,2) DEFAULT 0
      `);
        }
        catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }
        console.log('🔄 Checking for missing user table columns...');
        try {
            const [cognitoIdColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'cognito_id'
      `);
            if (cognitoIdColumns.length === 0) {
                console.log('➕ Adding cognito_id column to users table...');
                await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN cognito_id VARCHAR(255) AFTER email,
          ADD INDEX idx_user_cognito (cognito_id)
        `);
                console.log('✅ Added cognito_id column');
            }
            else {
                console.log('✅ cognito_id column already exists');
            }
            const [firstNameColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'first_name'
      `);
            if (firstNameColumns.length === 0) {
                console.log('➕ Adding first_name column to users table...');
                await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN first_name VARCHAR(255) AFTER name
        `);
                console.log('✅ Added first_name column');
            }
            else {
                console.log('✅ first_name column already exists');
            }
            const [lastNameColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'last_name'
      `);
            if (lastNameColumns.length === 0) {
                console.log('➕ Adding last_name column to users table...');
                await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN last_name VARCHAR(255) AFTER first_name
        `);
                console.log('✅ Added last_name column');
            }
            else {
                console.log('✅ last_name column already exists');
            }
        }
        catch (migrationError) {
            console.warn('⚠️  User table migration warning:', migrationError);
        }
        console.log('✅ Database tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating database tables:', error);
        throw error;
    }
};
export const getConnection = () => {
    if (!connection) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return connection;
};
export const testConnection = async () => {
    try {
        const conn = getConnection();
        await conn.ping();
        console.log('✅ Database connection is healthy');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
};
export const closeConnection = async () => {
    if (connection) {
        await connection.end();
        connection = null;
        console.log('✅ Database connection closed');
    }
};
process.on('SIGINT', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    await closeConnection();
    process.exit(0);
});
//# sourceMappingURL=database.js.map