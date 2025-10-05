import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/UserService.js';
import { ActivityService } from '../services/ActivityService.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { authenticateToken } from '../middleware/auth.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { QuoteRepository } from '../repositories/QuoteRepository.js';
const router = Router();
const companyRepository = new CompanyRepository();
const quoteRepository = new QuoteRepository();
const activityRepository = new ActivityRepository();
const userService = new UserService();
const activityService = new ActivityService(activityRepository);
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_super_user) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    return next();
};
const validateAddUser = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean')
];
const validateUpdateUserRole = [
    body('isAdmin').isBoolean().withMessage('isAdmin must be a boolean'),
    body('isApproved').isBoolean().withMessage('isApproved must be a boolean')
];
router.use(authenticateToken);
router.use(requireAdmin);
router.get('/company-users', async (req, res) => {
    try {
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const companyUsers = await userService.getUsersByCompany(adminUser.company_id);
        const response = {
            success: true,
            data: companyUsers,
            message: 'Company users retrieved successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/add-user', validateAddUser, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const { email, firstName, lastName } = req.body;
        const existingUser = await userService.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newUser = await userService.createUser({
            id: userId,
            email,
            firstName,
            lastName,
            cognitoId: email,
            company_id: adminUser.company_id,
            isApproved: true
        });
        const response = {
            success: true,
            data: newUser,
            message: 'User added to company successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.put('/user/:userId/role', validateUpdateUserRole, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const { isAdmin, isApproved } = req.body;
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const targetUser = await userService.getUserById(userId);
        if (!targetUser || targetUser.company_id !== adminUser.company_id) {
            return res.status(403).json({
                success: false,
                error: 'User not found in your company'
            });
        }
        if (userId === adminUserId && !isAdmin) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove your own admin privileges'
            });
        }
        const updatedUser = await userService.updateUser(userId, {
            isAdmin,
            isApproved
        });
        const response = {
            success: true,
            data: updatedUser,
            message: 'User role updated successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/user/:userId/activity', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const { limit = 50, offset = 0 } = req.query;
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const targetUser = await userService.getUserById(userId);
        if (!targetUser || targetUser.company_id !== adminUser.company_id) {
            return res.status(403).json({
                success: false,
                error: 'User not found in your company'
            });
        }
        const activities = await activityService.getUserActivities(userId, parseInt(limit), parseInt(offset));
        const response = {
            success: true,
            data: {
                userId,
                userName: `${targetUser.firstName} ${targetUser.lastName}`,
                activities
            },
            message: 'User activity retrieved successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/company-users/activity', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const companyUsers = await userService.getUsersByCompany(adminUser.company_id);
        const usersWithActivity = await Promise.all(companyUsers.map(async (user) => {
            const recentActivity = await activityService.getUserActivities(user.id, parseInt(limit), 0);
            return {
                ...user,
                recentActivity
            };
        }));
        const response = {
            success: true,
            data: usersWithActivity,
            message: 'Company users with activity retrieved successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const adminUserId = req.user.id;
        const adminUser = await userService.getUserById(adminUserId);
        if (!adminUser || !adminUser.company_id) {
            return res.status(400).json({
                success: false,
                error: 'Admin user not found or not associated with a company'
            });
        }
        const targetUser = await userService.getUserById(userId);
        if (!targetUser || targetUser.company_id !== adminUser.company_id) {
            return res.status(403).json({
                success: false,
                error: 'User not found in your company'
            });
        }
        if (userId === adminUserId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove yourself from the company'
            });
        }
        await userService.updateUser(userId, {
            company_id: null,
            is_approved: false
        });
        const response = {
            success: true,
            message: 'User removed from company successfully'
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default router;
//# sourceMappingURL=adminRoutes.js.map