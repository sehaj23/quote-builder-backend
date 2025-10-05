import { User, CreateUserRequest, UpdateUserRequest } from '../types/index.js';
export declare class UserRepository {
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(userData: CreateUserRequest & {
        cognitoId: string;
    }): Promise<User>;
    update(id: string, updateData: UpdateUserRequest): Promise<User | null>;
    delete(id: string): Promise<boolean>;
    findPending(): Promise<User[]>;
    findApproved(): Promise<User[]>;
    findByCompany(companyId: number): Promise<User[]>;
    updateLastActivity(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        approved: number;
        pending: number;
        superUsers: number;
    }>;
    findSuperUsers(): Promise<User[]>;
    findRecentlyActive(limit?: number): Promise<User[]>;
}
//# sourceMappingURL=UserRepository.d.ts.map