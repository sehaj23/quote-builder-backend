import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'dl4cl0621',
    database: process.env.DB_NAME || 'quotebuilder_web',
    port: parseInt(process.env.DB_PORT || '3306'),
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
            charset: dbConfig.charset
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_name (name),
        INDEX idx_company_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
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