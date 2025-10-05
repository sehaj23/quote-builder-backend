import { CognitoService } from './CognitoService.js';
export class SuperUserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getUsersByCompany(companyId) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        return await this.userRepository.findByCompany(companyId);
    }
    async createUserForCompany(companyId, userData) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!userData.email || !userData.email.trim()) {
            throw new Error('Email is required');
        }
        if (!userData.password || userData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        const sanitizedData = {
            email: userData.email.trim().toLowerCase(),
            company_id: companyId,
            isApproved: true
        };
        if (userData.firstName?.trim()) {
            sanitizedData.firstName = userData.firstName.trim();
        }
        if (userData.lastName?.trim()) {
            sanitizedData.lastName = userData.lastName.trim();
        }
        const fullName = `${userData.firstName?.trim() || ''} ${userData.lastName?.trim() || ''}`.trim();
        if (userData.name?.trim()) {
            sanitizedData.name = userData.name.trim();
        }
        else if (fullName) {
            sanitizedData.name = fullName;
        }
        try {
            const existingUser = await this.userRepository.findByEmail(sanitizedData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            const cognitoUserId = await CognitoService.createUser({
                email: sanitizedData.email,
                firstName: sanitizedData.firstName || '',
                lastName: sanitizedData.lastName || '',
                password: userData.password
            });
            const newUser = await this.userRepository.create({
                ...sanitizedData,
                cognitoId: cognitoUserId
            });
            return newUser;
        }
        catch (error) {
            console.error('Error in SuperUserService.createUserForCompany:', error);
            throw error;
        }
    }
    async updateUserInCompany(companyId, userId, userData) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!userId || userId.trim().length === 0) {
            throw new Error('Valid user ID is required');
        }
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new Error('User not found');
        }
        if (existingUser.company_id !== companyId) {
            throw new Error('User does not belong to this company');
        }
        const sanitizedData = {};
        if (userData.name !== undefined) {
            const trimmedName = userData.name?.trim();
            if (trimmedName) {
                sanitizedData.name = trimmedName;
            }
        }
        if (userData.is_approved !== undefined) {
            sanitizedData.is_approved = userData.is_approved;
        }
        if (userData.is_super_user !== undefined && !existingUser.is_super_user) {
            sanitizedData.is_super_user = userData.is_super_user;
        }
        try {
            return await this.userRepository.update(userId, sanitizedData);
        }
        catch (error) {
            console.error('Error in SuperUserService.updateUserInCompany:', error);
            throw error;
        }
    }
    async removeUserFromCompany(companyId, userId) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!userId || userId.trim().length === 0) {
            throw new Error('Valid user ID is required');
        }
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new Error('User not found');
        }
        if (existingUser.company_id !== companyId) {
            throw new Error('User does not belong to this company');
        }
        if (existingUser.is_super_user) {
            throw new Error('Cannot remove super user from company. Contact system administrator.');
        }
        try {
            const updated = await this.userRepository.update(userId, { company_id: null, is_approved: false });
            return updated !== null;
        }
        catch (error) {
            console.error('Error in SuperUserService.removeUserFromCompany:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        if (!userId || userId.trim().length === 0) {
            throw new Error('Valid user ID is required');
        }
        return await this.userRepository.findById(userId);
    }
    async getAllUsers() {
        return await this.userRepository.findAll();
    }
    async getUserStats() {
        return await this.userRepository.getStats();
    }
    async getCompanyUserStats(companyId) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        const users = await this.userRepository.findByCompany(companyId);
        return {
            total: users.length,
            approved: users.filter(user => user.is_approved).length,
            pending: users.filter(user => !user.is_approved).length
        };
    }
}
//# sourceMappingURL=SuperUserService.js.map