import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService.js';
const userService = new UserService();
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET not configured');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error'
        });
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await userService.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }
        req.user = {
            id: user.id,
            email: user.email,
            cognitoId: user.cognito_id,
            isApproved: user.is_approved,
            isSuperUser: user.is_super_user,
            company_id: user.company_id
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token verification failed'
        });
    }
};
export const requireApproved = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (!req.user.isApproved) {
        return res.status(403).json({
            success: false,
            message: 'Account not approved - contact administrator'
        });
    }
    next();
};
export const requireSuperUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (!req.user.isSuperUser) {
        return res.status(403).json({
            success: false,
            message: 'Super user access required'
        });
    }
    next();
};
export const requireCompanyAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    const requestedCompanyId = req.params.companyId || req.params.id;
    if (!req.user.isSuperUser && req.user.company_id && requestedCompanyId && parseInt(requestedCompanyId) !== req.user.company_id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied - insufficient permissions for this company'
        });
    }
    return next();
};
//# sourceMappingURL=auth.js.map