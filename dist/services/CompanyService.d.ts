import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/index.js';
export declare class CompanyService {
    private companyRepository;
    constructor();
    getAllCompanies(): Promise<Company[]>;
    getCompanyById(id: number): Promise<Company>;
    createCompany(companyData: CreateCompanyRequest): Promise<{
        id: number;
        company: Company;
    }>;
    updateCompany(id: number, companyData: UpdateCompanyRequest): Promise<Company>;
    deleteCompany(id: number): Promise<void>;
    getCompanyStats(): Promise<{
        totalCompanies: number;
    }>;
    private isValidEmail;
}
//# sourceMappingURL=CompanyService.d.ts.map