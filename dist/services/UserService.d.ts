import { User, CreateUserRequest, UpdateUserRequest } from '../types/index.js';
export declare class UserService {
    static getAllUsers(): Promise<User[]>;
    static getUserById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static create(userData: CreateUserRequest & {
        cognitoId: string;
    }): Promise<User>;
    static updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null>;
    static deleteUser(id: string): Promise<boolean>;
    static getPendingUsers(): Promise<User[]>;
    static getApprovedUsers(): Promise<User[]>;
    static getUsersByCompany(companyId: number): Promise<User[]>;
    static updateLastActivity(id: string): Promise<void>;
    static getUserStats(): Promise<{
        total: number;
        approved: number;
        pending: number;
        superUsers: number;
    }>;
    static getSuperUsers(): Promise<User[]>;
    static getRecentlyActiveUsers(limit?: number): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    getUserById(id: string): Promise<User | null>;
    createUser(userData: CreateUserRequest & {
        cognitoId: string;
    }): Promise<User>;
    updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getPendingUsers(): Promise<User[]>;
    updateLastActivity(id: string): Promise<void>;
}
//# sourceMappingURL=UserService.d.ts.map