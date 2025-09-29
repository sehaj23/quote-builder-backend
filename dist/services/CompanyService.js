import { CompanyRepository } from '@/repositories/CompanyRepository.js';
export class CompanyService {
    companyRepository;
    constructor() {
        this.companyRepository = new CompanyRepository();
    }
    async getAllCompanies() {
        try {
            return await this.companyRepository.findAll();
        }
        catch (error) {
            console.error('Service error - getAllCompanies:', error);
            throw error;
        }
    }
    async getCompanyById(id) {
        try {
            if (!id || id <= 0) {
                throw new Error('Invalid company ID provided');
            }
            const company = await this.companyRepository.findById(id);
            if (!company) {
                throw new Error('Company not found');
            }
            return company;
        }
        catch (error) {
            console.error(`Service error - getCompanyById(${id}):`, error);
            throw error;
        }
    }
    async createCompany(companyData) {
        try {
            if (!companyData.name || companyData.name.trim().length === 0) {
                throw new Error('Company name is required');
            }
            if (companyData.email && !this.isValidEmail(companyData.email)) {
                throw new Error('Invalid email format');
            }
            if (companyData.email) {
                const existingCompany = await this.companyRepository.findByEmail(companyData.email);
                if (existingCompany) {
                    throw new Error('Company with this email already exists');
                }
            }
            const sanitizedData = {
                name: companyData.name.trim(),
                address: companyData.address?.trim() || undefined,
                email: companyData.email?.trim().toLowerCase() || undefined,
                phone: companyData.phone?.trim() || undefined,
                terms: companyData.terms?.trim() || undefined,
                logo_path: companyData.logo_path?.trim() || undefined
            };
            const companyId = await this.companyRepository.create(sanitizedData);
            const createdCompany = await this.companyRepository.findById(companyId);
            if (!createdCompany) {
                throw new Error('Failed to retrieve created company');
            }
            return { id: companyId, company: createdCompany };
        }
        catch (error) {
            console.error('Service error - createCompany:', error);
            throw error;
        }
    }
    async updateCompany(id, companyData) {
        try {
            if (!id || id <= 0) {
                throw new Error('Invalid company ID provided');
            }
            const existingCompany = await this.companyRepository.findById(id);
            if (!existingCompany) {
                throw new Error('Company not found');
            }
            if (companyData.email && !this.isValidEmail(companyData.email)) {
                throw new Error('Invalid email format');
            }
            if (companyData.email) {
                const companyWithEmail = await this.companyRepository.findByEmail(companyData.email);
                if (companyWithEmail && companyWithEmail.id !== id) {
                    throw new Error('Email is already used by another company');
                }
            }
            const sanitizedData = {};
            if (companyData.name !== undefined) {
                if (!companyData.name || companyData.name.trim().length === 0) {
                    throw new Error('Company name cannot be empty');
                }
                sanitizedData.name = companyData.name.trim();
            }
            if (companyData.address !== undefined) {
                sanitizedData.address = companyData.address?.trim() || undefined;
            }
            if (companyData.email !== undefined) {
                sanitizedData.email = companyData.email?.trim().toLowerCase() || undefined;
            }
            if (companyData.phone !== undefined) {
                sanitizedData.phone = companyData.phone?.trim() || undefined;
            }
            if (companyData.terms !== undefined) {
                sanitizedData.terms = companyData.terms?.trim() || undefined;
            }
            if (companyData.logo_path !== undefined) {
                sanitizedData.logo_path = companyData.logo_path?.trim() || undefined;
            }
            const updated = await this.companyRepository.update(id, sanitizedData);
            if (!updated) {
                throw new Error('Failed to update company');
            }
            const updatedCompany = await this.companyRepository.findById(id);
            if (!updatedCompany) {
                throw new Error('Failed to retrieve updated company');
            }
            return updatedCompany;
        }
        catch (error) {
            console.error(`Service error - updateCompany(${id}):`, error);
            throw error;
        }
    }
    async deleteCompany(id) {
        try {
            if (!id || id <= 0) {
                throw new Error('Invalid company ID provided');
            }
            const exists = await this.companyRepository.exists(id);
            if (!exists) {
                throw new Error('Company not found');
            }
            const deleted = await this.companyRepository.delete(id);
            if (!deleted) {
                throw new Error('Failed to delete company');
            }
        }
        catch (error) {
            console.error(`Service error - deleteCompany(${id}):`, error);
            throw error;
        }
    }
    async getCompanyStats() {
        try {
            const totalCompanies = await this.companyRepository.count();
            return { totalCompanies };
        }
        catch (error) {
            console.error('Service error - getCompanyStats:', error);
            throw error;
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
//# sourceMappingURL=CompanyService.js.map