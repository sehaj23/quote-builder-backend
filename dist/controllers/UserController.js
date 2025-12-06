import { validationResult } from 'express-validator';
export class UserController {
    userService;
    activityService;
    companyService;
    constructor(userService, activityService, companyService) {
        this.userService = userService;
        this.activityService = activityService;
        this.companyService = companyService;
    }
    async getUserDetailsWithCompany(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserById(userId);
            if (!user) {
                const response = {
                    success: false,
                    error: 'User not found'
                };
                return res.status(404).json(response);
            }
            const company = await this.companyService.getCompanyById(user.company_id);
            const data = {
                ...user,
                company: company
            };
            const response = {
                success: true,
                data: data,
                message: 'User details with company retrieved successfully'
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
            const users = await this.userService.getAllUsers();
            const response = {
                success: true,
                data: users,
                message: 'Users retrieved successfully'
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
            const user = await this.userService.getUserById(userId);
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
    async createUser(req, res) {
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
            const userData = req.body;
            if (!userData.id) {
                userData.id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            const userWithCognito = {
                ...userData,
                cognitoId: userData.cognitoId || userData.id || userData.email,
            };
            const user = await this.userService.createUser(userWithCognito);
            await this.activityService.logActivity({
                user_id: userData.id || user.id,
                company_id: userData.company_id || 0,
                action: 'user_created',
                description: `User ${userData.email} created account`,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            const response = {
                success: true,
                data: user,
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
    async updateUser(req, res) {
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
            const { userId } = req.params;
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            const updateData = req.body;
            const updatedUser = await this.userService.updateUser(userId, updateData);
            if (!updatedUser) {
                const response = {
                    success: false,
                    error: 'User not found'
                };
                return res.status(404).json(response);
            }
            await this.activityService.logActivity({
                user_id: userId,
                company_id: updatedUser.company_id,
                action: 'user_updated',
                description: `User ${updatedUser.email} profile updated`,
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
    async approveUser(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            const updatedUser = await this.userService.updateUser(userId, { is_approved: true });
            if (!updatedUser) {
                const response = {
                    success: false,
                    error: 'User not found'
                };
                return res.status(404).json(response);
            }
            await this.activityService.logActivity({
                user_id: userId,
                company_id: updatedUser.company_id,
                action: 'user_approved',
                description: `User ${updatedUser.email} approved by admin`,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            const response = {
                success: true,
                data: updatedUser,
                message: 'User approved successfully'
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
    async getPendingUsers(_req, res) {
        try {
            const users = await this.userService.getPendingUsers();
            const response = {
                success: true,
                data: users,
                message: 'Pending users retrieved successfully'
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
    async updateLastActivity(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                const response = {
                    success: false,
                    error: 'User ID is required'
                };
                return res.status(400).json(response);
            }
            await this.userService.updateLastActivity(userId);
            const response = {
                success: true,
                message: 'Last activity updated'
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
//# sourceMappingURL=UserController.js.map