import { UserRepository } from '@/repositories/UserRepository.js';
const userRepository = new UserRepository();
export class UserService {
    static async getAllUsers() {
        return userRepository.findAll();
    }
    static async getUserById(id) {
        return userRepository.findById(id);
    }
    static async findByEmail(email) {
        return userRepository.findByEmail(email);
    }
    static async create(userData) {
        return userRepository.create(userData);
    }
    static async updateUser(id, updateData) {
        return userRepository.update(id, updateData);
    }
    static async deleteUser(id) {
        return userRepository.delete(id);
    }
    static async getPendingUsers() {
        return userRepository.findPending();
    }
    static async getApprovedUsers() {
        return userRepository.findApproved();
    }
    static async getUsersByCompany(companyId) {
        return userRepository.findByCompany(companyId);
    }
    static async updateLastActivity(id) {
        return userRepository.updateLastActivity(id);
    }
    static async getUserStats() {
        return userRepository.getStats();
    }
    static async getSuperUsers() {
        return userRepository.findSuperUsers();
    }
    static async getRecentlyActiveUsers(limit) {
        return userRepository.findRecentlyActive(limit);
    }
    async getAllUsers() {
        return UserService.getAllUsers();
    }
    async getUserById(id) {
        return UserService.getUserById(id);
    }
    async createUser(userData) {
        return UserService.create(userData);
    }
    async updateUser(id, updateData) {
        return UserService.updateUser(id, updateData);
    }
    async deleteUser(id) {
        return UserService.deleteUser(id);
    }
    async getPendingUsers() {
        return UserService.getPendingUsers();
    }
    async updateLastActivity(id) {
        return UserService.updateLastActivity(id);
    }
}
//# sourceMappingURL=UserService.js.map