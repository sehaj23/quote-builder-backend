import { CompanyRepository } from '@/repositories/CompanyRepository.js';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/index.js';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      return await this.companyRepository.findAll();
    } catch (error) {
      console.error('Service error - getAllCompanies:', error);
      throw error;
    }
  }

  async getCompanyById(id: number): Promise<Company> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid company ID provided');
      }

      const company = await this.companyRepository.findById(id);
      
      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    } catch (error) {
      console.error(`Service error - getCompanyById(${id}):`, error);
      throw error;
    }
  }

  async createCompany(companyData: CreateCompanyRequest): Promise<{ id: number; company: Company }> {
    try {
      // Validate required fields
      if (!companyData.name || companyData.name.trim().length === 0) {
        throw new Error('Company name is required');
      }

      // Validate email format if provided
      if (companyData.email && !this.isValidEmail(companyData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if company with email already exists (if email provided)
      if (companyData.email) {
        const existingCompany = await this.companyRepository.findByEmail(companyData.email);
        if (existingCompany) {
          throw new Error('Company with this email already exists');
        }
      }

      // Sanitize and prepare data
      const sanitizedData: CreateCompanyRequest = {
        name: companyData.name.trim(),
        address: companyData.address?.trim() || undefined,
        email: companyData.email?.trim().toLowerCase() || undefined,
        phone: companyData.phone?.trim() || undefined,
        terms: companyData.terms?.trim() || undefined,
        logo_path: companyData.logo_path?.trim() || undefined
      };

      // Create the company
      const companyId = await this.companyRepository.create(sanitizedData);
      
      // Fetch and return the created company
      const createdCompany = await this.companyRepository.findById(companyId);
      
      if (!createdCompany) {
        throw new Error('Failed to retrieve created company');
      }

      return { id: companyId, company: createdCompany };
    } catch (error) {
      console.error('Service error - createCompany:', error);
      throw error;
    }
  }

  async updateCompany(id: number, companyData: UpdateCompanyRequest): Promise<Company> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid company ID provided');
      }

      // Check if company exists
      const existingCompany = await this.companyRepository.findById(id);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Validate email format if provided
      if (companyData.email && !this.isValidEmail(companyData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if email is already used by another company
      if (companyData.email) {
        const companyWithEmail = await this.companyRepository.findByEmail(companyData.email);
        if (companyWithEmail && companyWithEmail.id !== id) {
          throw new Error('Email is already used by another company');
        }
      }

      // Sanitize and prepare data
      const sanitizedData: UpdateCompanyRequest = {};
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

      // Update the company
      const updated = await this.companyRepository.update(id, sanitizedData);
      
      if (!updated) {
        throw new Error('Failed to update company');
      }

      // Fetch and return the updated company
      const updatedCompany = await this.companyRepository.findById(id);
      if (!updatedCompany) {
        throw new Error('Failed to retrieve updated company');
      }

      return updatedCompany;
    } catch (error) {
      console.error(`Service error - updateCompany(${id}):`, error);
      throw error;
    }
  }

  async deleteCompany(id: number): Promise<void> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid company ID provided');
      }

      // Check if company exists
      const exists = await this.companyRepository.exists(id);
      if (!exists) {
        throw new Error('Company not found');
      }

      const deleted = await this.companyRepository.delete(id);
      
      if (!deleted) {
        throw new Error('Failed to delete company');
      }
    } catch (error) {
      console.error(`Service error - deleteCompany(${id}):`, error);
      throw error;
    }
  }

  async getCompanyStats(): Promise<{ totalCompanies: number }> {
    try {
      const totalCompanies = await this.companyRepository.count();
      return { totalCompanies };
    } catch (error) {
      console.error('Service error - getCompanyStats:', error);
      throw error;
    }
  }

  async incrementQuoteNumber(companyId: number): Promise<number> {
    try {
      if (!companyId || companyId <= 0) {
        throw new Error('Invalid company ID provided');
      }

      // Check if company exists
      const existingCompany = await this.companyRepository.findById(companyId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Get current next_quote_number or default to 100
      const currentNumber = existingCompany.next_quote_number || 100;
      const newNextNumber = currentNumber + 1;

      // Update the company's next_quote_number
      await this.companyRepository.update(companyId, {
        next_quote_number: newNextNumber
      });

      return newNextNumber;
    } catch (error) {
      console.error(`Service error - incrementQuoteNumber(${companyId}):`, error);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}