import { Request, Response } from 'express';
export declare class AuthController {
    static validateSignup: import("express-validator").ValidationChain[];
    static validateSignupWithCompany: import("express-validator").ValidationChain[];
    static validateLogin: import("express-validator").ValidationChain[];
    static signup(req: Request, res: Response): Promise<Response>;
    static login(req: Request, res: Response): Promise<Response>;
    static getUserInfo(req: Request, res: Response): Promise<Response>;
    static forgotPassword(req: Request, res: Response): Promise<Response>;
    static signupWithCompany(req: Request, res: Response): Promise<Response>;
    static validateSession(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=AuthController.d.ts.map