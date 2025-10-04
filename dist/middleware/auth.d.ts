import { Request, Response, NextFunction } from 'express';
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
export declare const requireApproved: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const requireSuperUser: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const requireCompanyAccess: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map