import { User, CreateUserRequest, UpdateUserRequest } from '../types/index.js';
import { UserRepository } from '../repositories/UserRepository.js';
export declare class SuperUserService {
    private userRepository;
    constructor(userRepository: UserRepository);
    getUsersByCompany(companyId: number): Promise<User[]>;
    createUserForCompany(companyId: number, userData: CreateUserRequest & {
        password: string;
    }): Promise<User>;
    updateUserInCompany(companyId: number, userId: string, userData: UpdateUserRequest): Promise<User | null>;
    removeUserFromCompany(companyId: number, userId: string): Promise<boolean>;
    getUserById(userId: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    getUserStats(): Promise<{
        total: number;
        approved: number;
        pending: number;
        superUsers: number;
    }>;
    getCompanyUserStats(companyId: number): Promise<{
        total: number;
        approved: number;
        pending: number;
    }>;
}
//# sourceMappingURL=SuperUserService.d.ts.map