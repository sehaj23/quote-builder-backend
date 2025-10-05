import { Router } from 'express';
import { body } from 'express-validator';
import { ActivityController } from '../controllers/ActivityController.js';
import { ActivityService } from '../services/ActivityService.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
const activityRepository = new ActivityRepository();
const activityService = new ActivityService(activityRepository);
const activityController = new ActivityController(activityService);
const validateLogActivity = [
    body('user_id').notEmpty().withMessage('User ID is required'),
    body('action').notEmpty().withMessage('Action is required'),
    body('company_id').optional().isInt().withMessage('Company ID must be an integer'),
    body('resource_type').optional().isString().withMessage('Resource type must be a string'),
    body('resource_id').optional().isInt().withMessage('Resource ID must be an integer'),
    body('description').optional().isString().withMessage('Description must be a string')
];
router.get('/', authenticateToken, activityController.getActivities.bind(activityController));
router.get('/stats', authenticateToken, activityController.getActivityStats.bind(activityController));
router.get('/:activityId', authenticateToken, activityController.getActivityById.bind(activityController));
router.post('/', authenticateToken, validateLogActivity, activityController.logActivity.bind(activityController));
router.get('/company/:companyId', authenticateToken, activityController.getCompanyActivities.bind(activityController));
router.get('/company/:companyId/stats', authenticateToken, activityController.getActivityStats.bind(activityController));
router.get('/user/:userId', authenticateToken, activityController.getUserActivities.bind(activityController));
export default router;
//# sourceMappingURL=activityRoutes.js.map