import { Router } from 'express';
import { SuperUserController } from '../controllers/SuperUserController.js';
import { SuperUserService } from '../services/SuperUserService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { ActivityService } from '../services/ActivityService.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { authenticateToken, requireSuperUser } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Dependency injection
const userRepository = new UserRepository();
const activityRepository = new ActivityRepository();
const superUserService = new SuperUserService(userRepository);
const activityService = new ActivityService(activityRepository);
const superUserController = new SuperUserController(superUserService, activityService);

// Super User routes
// Note: These routes are mounted under /api/companies/:companyId/users and /api/admin/users

// Company-specific user management routes (mounted under /api/companies/:companyId/users)
router.get('/', authenticateToken, requireSuperUser, superUserController.getUsersByCompany.bind(superUserController));  // GET /api/companies/:companyId/users
router.post('/', authenticateToken, requireSuperUser, superUserController.createUserForCompany.bind(superUserController));  // POST /api/companies/:companyId/users
router.get('/stats', authenticateToken, requireSuperUser, superUserController.getCompanyUserStats.bind(superUserController));  // GET /api/companies/:companyId/users/stats

// Individual user management routes in company context (mounted under /api/companies/:companyId/users)
router.put('/:userId', authenticateToken, requireSuperUser, superUserController.updateUserInCompany.bind(superUserController));  // PUT /api/companies/:companyId/users/:userId
router.delete('/:userId', authenticateToken, requireSuperUser, superUserController.removeUserFromCompany.bind(superUserController));  // DELETE /api/companies/:companyId/users/:userId

// Individual user routes (mounted under /api/admin/users)
export const individualSuperUserRouter = Router();
individualSuperUserRouter.get('/', authenticateToken, requireSuperUser, superUserController.getAllUsers.bind(superUserController));  // GET /api/admin/users
individualSuperUserRouter.get('/stats', authenticateToken, requireSuperUser, superUserController.getUserStats.bind(superUserController));  // GET /api/admin/users/stats  
individualSuperUserRouter.get('/:userId', authenticateToken, requireSuperUser, superUserController.getUserById.bind(superUserController));  // GET /api/admin/users/:userId

// Activity routes
export const activityRouter = Router();
activityRouter.get('/company-users/activity', authenticateToken, requireSuperUser, superUserController.getCompanyUsersActivity.bind(superUserController));  // GET /api/admin/company-users/activity

export default router;