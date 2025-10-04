import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
router.post('/signup', AuthController.validateSignup, AuthController.signup);
router.post('/signup-with-company', AuthController.validateSignupWithCompany, AuthController.signupWithCompany);
router.post('/login', AuthController.validateLogin, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.get('/user/:email', authenticateToken, AuthController.getUserInfo);
export default router;
//# sourceMappingURL=authRoutes.js.map