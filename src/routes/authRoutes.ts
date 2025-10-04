import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public auth routes (no authentication required)
router.post('/signup', AuthController.validateSignup, AuthController.signup);
router.post('/signup-with-company', AuthController.validateSignupWithCompany, AuthController.signupWithCompany);
router.post('/login', AuthController.validateLogin, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);

// Protected auth routes (require authentication)
router.get('/user/:email', authenticateToken, AuthController.getUserInfo);
router.get('/validate-session', authenticateToken, AuthController.validateSession);

export default router;