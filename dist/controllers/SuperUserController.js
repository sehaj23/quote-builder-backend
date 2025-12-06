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
            try {
                const adminUserId = req.user?.id;
                let adminUserName = 'Admin';
                if (adminUserId) {
                    const adminUser = await this.superUserService.getUserById(adminUserId);
                    adminUserName = adminUser?.name || adminUser?.email || 'Admin';
                }
                await this.activityService.logActivity({
                    user_id: adminUserId,
                    company_id: companyIdNum,
                    action: 'user_created_by_admin',
                    description: `${adminUserName} created new user ${userData.email} for company`,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }
            catch (logError) {
                console.error('Failed to log activity:', logError);
            }
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
            try {
                const adminUserId = req.user?.id;
                let adminUserName = 'Admin';
                if (adminUserId) {
                    const adminUser = await this.superUserService.getUserById(adminUserId);
                    adminUserName = adminUser?.name || adminUser?.email || 'Admin';
                }
                await this.activityService.logActivity({
                    user_id: adminUserId,
                    company_id: companyIdNum,
                    action: 'user_updated_by_admin',
                    description: `${adminUserName} updated user ${updatedUser.email} in company`,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }
            catch (logError) {
                console.error('Failed to log activity:', logError);
            }
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
            try {
                const adminUserId = req.user?.id;
                let adminUserName = 'Admin';
                if (adminUserId) {
                    const adminUser = await this.superUserService.getUserById(adminUserId);
                    adminUserName = adminUser?.name || adminUser?.email || 'Admin';
                }
                await this.activityService.logActivity({
                    user_id: adminUserId,
                    company_id: companyIdNum,
                    action: 'user_removed_by_admin',
                    description: `${adminUserName} removed user ${userId} from company`,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }
            catch (logError) {
                console.error('Failed to log activity:', logError);
            }
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
    async getCompanyUsersActivity(req, res) {
        try {
            const userCompanyId = req.user?.company_id;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : (req.query.limit ? parseInt(req.query.limit) : 20);
            const offset = (page - 1) * pageSize;
            if (!userCompanyId) {
                const response = {
                    success: false,
                    error: 'Company ID not available from user context'
                };
                return res.status(400).json(response);
            }
            if (page < 1 || pageSize < 1 || pageSize > 100) {
                const response = {
                    success: false,
                    error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100'
                };
                return res.status(400).json(response);
            }
            const [activities, totalCount] = await Promise.all([
                this.activityService.getCompanyActivities(userCompanyId, pageSize, offset),
                this.activityService.countActivitiesByCompany(userCompanyId)
            ]);
            const transformedActivities = activities.map((activity) => ({
                action: activity.action,
                description: activity.description || '',
                performedBy: activity.user_name || activity.user_email || 'Unknown User',
                performedByEmail: activity.user_email || '',
                resourceType: activity.resource_type || '',
                timestamp: activity.created_at,
                ipAddress: activity.ip_address || '',
                userAgent: activity.user_agent || ''
            }));
            const response = {
                success: true,
                data: {
                    activities: transformedActivities,
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalItems: totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                        hasNextPage: page < Math.ceil(totalCount / pageSize),
                        hasPrevPage: page > 1
                    }
                },
                message: 'Company user activities retrieved successfully'
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