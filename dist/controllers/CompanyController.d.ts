import { Request, Response } from 'express';
import { CompanyService } from '@/services/CompanyService.js';
export declare class CompanyController {
    private companyService;
    constructor(companyService: CompanyService);
    getAllCompanies(_req: Request, res: Response): Promise<void>;
    getCompanyById(req: Request, res: Response): Promise<void>;
    createCompany(req: Request, res: Response): Promise<void>;
    updateCompany(req: Request, res: Response): Promise<void>;
    deleteCompany(req: Request, res: Response): Promise<void>;
    getCompanyStats(_req: Request, res: Response): Promise<void>;
    incrementQuoteNumber(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=CompanyController.d.ts.map