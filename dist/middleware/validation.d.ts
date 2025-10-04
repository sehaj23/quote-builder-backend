import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreateCompany: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateUpdateCompany: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateIdParam: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateCreateItem: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateCreateQuote: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
//# sourceMappingURL=validation.d.ts.map