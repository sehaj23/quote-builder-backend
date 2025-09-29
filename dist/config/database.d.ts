import mysql from 'mysql2/promise';
import { DatabaseConfig } from '@/types/index.js';
export declare const dbConfig: DatabaseConfig;
export declare const initDatabase: () => Promise<mysql.Connection>;
export declare const getConnection: () => mysql.Connection;
export declare const testConnection: () => Promise<boolean>;
export declare const closeConnection: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map