import { CompanyRepository } from '@/repositories/CompanyRepository.js';
import { QuoteRepository } from '@/repositories/QuoteRepository.js';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/index.js';
export declare class CompanyService {
    private companyRepository;
    private quoteRepository;
    constructor(companyRepository: CompanyRepository, quoteRepository: QuoteRepository);
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
    incrementQuoteNumber(companyId: number): Promise<number>;
    getCompanyAnalytics(companyId: number): Promise<any>;
    private isValidEmail;
}
//# sourceMappingURL=CompanyService.d.ts.map