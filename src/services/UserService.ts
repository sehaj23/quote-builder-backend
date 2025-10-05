import { UserRepository } from '../repositories/UserRepository.js';
import { User, CreateUserRequest, UpdateUserRequest } from '../types/index.js';

const userRepository = new UserRepository();

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  static async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  }

  static async create(userData: CreateUserRequest & { cognitoId: string }): Promise<User> {
    return userRepository.create(userData);
  }

  static async updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    return userRepository.update(id, updateData);
  }

  static async deleteUser(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  static async getPendingUsers(): Promise<User[]> {
    return userRepository.findPending();
  }

  static async getApprovedUsers(): Promise<User[]> {
    return userRepository.findApproved();
  }

  static async getUsersByCompany(companyId: number): Promise<User[]> {
    return userRepository.findByCompany(companyId);
  }

  static async updateLastActivity(id: string): Promise<void> {
    return userRepository.updateLastActivity(id);
  }

  static async getUserStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    superUsers: number;
  }> {
    return userRepository.getStats();
  }

  static async getSuperUsers(): Promise<User[]> {
    return userRepository.findSuperUsers();
  }

  static async getRecentlyActiveUsers(limit?: number): Promise<User[]> {
    return userRepository.findRecentlyActive(limit);
  }

  // Instance methods for dependency injection compatibility
  async getAllUsers(): Promise<User[]> {
    return UserService.getAllUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return UserService.getUserById(id);
  }

  async createUser(userData: CreateUserRequest & { cognitoId: string }): Promise<User> {
    return UserService.create(userData);
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    return UserService.updateUser(id, updateData);
  }

  async deleteUser(id: string): Promise<boolean> {
    return UserService.deleteUser(id);
  }

  async getPendingUsers(): Promise<User[]> {
    return UserService.getPendingUsers();
  }

  async updateLastActivity(id: string): Promise<void> {
    return UserService.updateLastActivity(id);
  }
}