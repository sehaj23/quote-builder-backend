import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { UserController } from '@/controllers/UserController.js';
import { UserService } from '@/services/UserService.js';
import { ActivityService } from '@/services/ActivityService.js';
import { ActivityRepository } from '@/repositories/ActivityRepository.js';
import { authenticateToken } from '@/middleware/auth.js';
import { CompanyRepository } from '@/repositories/CompanyRepository';
import { CompanyService } from '@/services/CompanyService';
import { QuoteRepository } from '@/repositories/QuoteRepository';

const router = Router();

// Dependency injection
const companyRepository = new CompanyRepository();
const quoteRepository = new QuoteRepository();
const companyService = new CompanyService(companyRepository, quoteRepository);
const activityRepository = new ActivityRepository();
const userService = new UserService();
const activityService = new ActivityService(activityRepository);

const userController = new UserController(userService, activityService, companyService);

// Validation middleware
const validateCreateUser = [
  body('id').notEmpty().withMessage('User ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('company_id').optional().isInt().withMessage('Company ID must be an integer')
];

const validateUpdateUser = [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('is_super_user').optional().isBoolean().withMessage('is_super_user must be a boolean'),
  body('is_approved').optional().isBoolean().withMessage('is_approved must be a boolean'),
  body('company_id').optional().isInt().withMessage('Company ID must be an integer')
];

// Apply authentication to all user routes
router.use(authenticateToken);

// Routes requiring approval
router.get('/details-with-company', authenticateToken, (req, res) => userController.getUserDetailsWithCompany(req, res));
router.post('/:userId/activity', authenticateToken, (req, res) => userController.updateLastActivity(req, res));

// Admin-only routes (super user access required)
router.get('/', authenticateToken, (req, res) => userController.getAllUsers(req, res));
router.get('/pending', authenticateToken, (req, res) => userController.getPendingUsers(req, res));
router.get('/:userId', authenticateToken, (req, res) => userController.getUserById(req, res));
router.post('/', authenticateToken, validateCreateUser, (req: Request, res: Response) => userController.createUser(req, res));
router.put('/:userId', authenticateToken, validateUpdateUser, (req: Request, res: Response) => userController.updateUser(req, res));
router.post('/:userId/approve', authenticateToken, (req, res) => userController.approveUser(req, res));

export default router;