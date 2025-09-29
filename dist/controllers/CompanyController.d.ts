import { Request, Response } from 'express';
export declare class CompanyController {
    private companyService;
    constructor();
    getAllCompanies: (req: Request, res: Response) => Promise<void>;
    getCompanyById: (req: Request, res: Response) => Promise<void>;
    createCompany: (req: Request, res: Response) => Promise<void>;
    updateCompany: (req: Request, res: Response) => Promise<void>;
    deleteCompany: (req: Request, res: Response) => Promise<void>;
    getCompanyStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=CompanyController.d.ts.map