import { validationResult } from 'express-validator';
export class SuperUserController {
    superUserService;
    activityService;
    constructor(superUserService, activityService) {
        this.superUserService = superUserService;
        this.activityService = activityService;
    }
    async getUsersByCompany(req, res) {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const companyIdNum = parseInt(companyId);
            if (isNaN(companyIdNum)) {
                const response = {
                    success: false,
                    error: 'Valid company ID is required'
                };
                return res.status(400).json(response);
            }
            const users = await this.superUserService.getUsersByCompany(companyIdNum);
            const response = {
                success: true,
                data: users,
                message: 'Company users retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async createUserForCompany(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const response = {
                    success: false,
                    error: 'Validation failed',
                    data: errors.array()
                };
                return res.status(400).json(response);
            }
            const { companyId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const companyIdNum = parseInt(companyId);
            if (isNaN(companyIdNum)) {
                const response = {
                    success: false,
                    error: 'Valid company ID is required'
                };
                return res.status(400).json(response);
            }
            const userData = req.body;
            if (!userData.password) {
                const response = {
                    success: false,
                    error: 'Password is required'
                };
                return res.status(400).json(response);
            }
            const newUser = await this.superUserService.createUserForCompany(companyIdNum, userData);
            const adminUserId = req.user?.id;
            await this.activityService.logActivity({
                user_id: adminUserId,
                company_id: companyIdNum,
                action: 'user_created_by_admin',
                description: `Super user created new user ${userData.email} for company ${companyIdNum}`,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            const response = {
                success: true,
                data: newUser,
                message: 'User created successfully'
            };
            return res.status(201).json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async updateUserInCompany(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const response = {
                    success: false,
                    error: 'Validation failed',
                    data: errors.array()
                };
                return res.status(400).json(response);
            }
            const { companyId, userId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const companyIdNum = parseInt(companyId);
            if (isNaN(companyIdNum)) {
                const response = {
                    success: false,
                    error: 'Valid company ID is required'
                };
                return res.status(400).json(response);
            }
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            const updateData = req.body;
            const updatedUser = await this.superUserService.updateUserInCompany(companyIdNum, userId, updateData);
            if (!updatedUser) {
                const response = {
                    success: false,
                    error: 'User not found or does not belong to this company'
                };
                return res.status(404).json(response);
            }
            const adminUserId = req.user?.id;
            await this.activityService.logActivity({
                user_id: adminUserId,
                company_id: companyIdNum,
                action: 'user_updated_by_admin',
                description: `Super user updated user ${updatedUser.email} in company ${companyIdNum}`,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            const response = {
                success: true,
                data: updatedUser,
                message: 'User updated successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async removeUserFromCompany(req, res) {
        try {
            const { companyId, userId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const companyIdNum = parseInt(companyId);
            if (isNaN(companyIdNum)) {
                const response = {
                    success: false,
                    error: 'Valid company ID is required'
                };
                return res.status(400).json(response);
            }
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            const success = await this.superUserService.removeUserFromCompany(companyIdNum, userId);
            if (!success) {
                const response = {
                    success: false,
                    error: 'Failed to remove user from company'
                };
                return res.status(500).json(response);
            }
            const adminUserId = req.user?.id;
            await this.activityService.logActivity({
                user_id: adminUserId,
                company_id: companyIdNum,
                action: 'user_removed_by_admin',
                description: `Super user removed user ${userId} from company ${companyIdNum}`,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            const response = {
                success: true,
                message: 'User removed from company successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            const user = await this.superUserService.getUserById(userId);
            if (!user) {
                const response = {
                    success: false,
                    error: 'User not found'
                };
                return res.status(404).json(response);
            }
            const response = {
                success: true,
                data: user,
                message: 'User retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getAllUsers(_req, res) {
        try {
            const users = await this.superUserService.getAllUsers();
            const response = {
                success: true,
                data: users,
                message: 'All users retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getUserStats(_req, res) {
        try {
            const stats = await this.superUserService.getUserStats();
            const response = {
                success: true,
                data: stats,
                message: 'User statistics retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getCompanyUserStats(req, res) {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const companyIdNum = parseInt(companyId);
            if (isNaN(companyIdNum)) {
                const response = {
                    success: false,
                    error: 'Valid company ID is required'
                };
                return res.status(400).json(response);
            }
            const stats = await this.superUserService.getCompanyUserStats(companyIdNum);
            const response = {
                success: true,
                data: stats,
                message: 'Company user statistics retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
}
//# sourceMappingURL=SuperUserController.js.map