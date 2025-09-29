import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/index.js';
export declare class CompanyRepository {
    private getDbConnection;
    findAll(): Promise<Company[]>;
    findById(id: number): Promise<Company | null>;
    findByEmail(email: string): Promise<Company | null>;
    create(companyData: CreateCompanyRequest): Promise<number>;
    update(id: number, companyData: UpdateCompanyRequest): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    exists(id: number): Promise<boolean>;
    count(): Promise<number>;
}
//# sourceMappingURL=CompanyRepository.d.ts.map