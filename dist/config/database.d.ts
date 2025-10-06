import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../types/index.js';
export declare const dbConfig: DatabaseConfig;
export declare const initDatabase: () => Promise<mysql.Pool>;
export declare const getConnection: () => mysql.Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const closeConnection: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map