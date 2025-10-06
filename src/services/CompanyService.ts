import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { QuoteRepository } from '../repositories/QuoteRepository.js';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types/index.js';

export class CompanyService {
  constructor(
    private companyRepository: CompanyRepository,
    private quoteRepository: QuoteRepository
  ) {}

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
        name: companyData.name.trim()
      };
      
      if (companyData.address?.trim()) {
        sanitizedData.address = companyData.address.trim();
      }
      if (companyData.email?.trim()) {
        sanitizedData.email = companyData.email.trim().toLowerCase();
      }
      if (companyData.phone?.trim()) {
        sanitizedData.phone = companyData.phone.trim();
      }
      if (companyData.terms?.trim()) {
        sanitizedData.terms = companyData.terms.trim();
      }
      if (companyData.logo_path?.trim()) {
        sanitizedData.logo_path = companyData.logo_path.trim();
      }
      if (companyData.currency?.trim()) {
        sanitizedData.currency = companyData.currency.trim().toUpperCase();
      } else {
        // Default to INR if not provided
        sanitizedData.currency = 'INR';
      }

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
        if (companyData.address?.trim()) {
          sanitizedData.address = companyData.address.trim();
        }
      }
      if (companyData.email !== undefined) {
        if (companyData.email?.trim()) {
          sanitizedData.email = companyData.email.trim().toLowerCase();
        }
      }
      if (companyData.phone !== undefined) {
        if (companyData.phone?.trim()) {
          sanitizedData.phone = companyData.phone.trim();
        }
      }
      if (companyData.terms !== undefined) {
        if (companyData.terms?.trim()) {
          sanitizedData.terms = companyData.terms.trim();
        }
      }
      if (companyData.logo_path !== undefined) {
        if (companyData.logo_path?.trim()) {
          sanitizedData.logo_path = companyData.logo_path.trim();
        }
      }
      if (companyData.currency !== undefined) {
        if (companyData.currency?.trim()) {
          sanitizedData.currency = companyData.currency.trim().toUpperCase();
        }
      }
      if (companyData.default_tax !== undefined) {
        if (companyData.default_tax) {
          sanitizedData.default_tax = companyData.default_tax;
        }
      }
      if (companyData.quote_prefix !== undefined) {
        if (companyData.quote_prefix?.trim()) {
          sanitizedData.quote_prefix = companyData.quote_prefix.trim();
        }
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

  async getCompanyAnalytics(companyId: number): Promise<any> {
    try {
      if (!companyId || companyId <= 0) {
        throw new Error('Invalid company ID provided');
      }

      // Check if company exists
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Get all quotes for the company
      const quotes = await this.quoteRepository.findByCompanyId(companyId);
      
      // Calculate analytics
      const totalQuotes = quotes.length;
      
      // Count quotes by status
      const quotesByStatus = {
        draft: 0,
        sent: 0,
        approved: 0,
        rejected: 0
      };

      let totalRevenue = 0;
      const monthlyData: { [key: string]: number } = {};

      quotes.forEach(quote => {
        // Count by status
        if (quote.status && quotesByStatus.hasOwnProperty(quote.status)) {
          quotesByStatus[quote.status as keyof typeof quotesByStatus]++;
        }

        // Calculate revenue (only for approved quotes)
        if (quote.status === 'approved') {
          totalRevenue += quote.total || 0;
        }

        // Group by month
        if (quote.created_at) {
          const date = new Date(quote.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });

      // Calculate average quote value
      const averageQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;

      // Convert monthly data to array format
      const monthlyQuotes = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // Last 6 months
        .map(([month, count]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          }),
          count
        }));

      return {
        totalQuotes,
        quotesByStatus,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        averageQuoteValue: Math.round(averageQuoteValue * 100) / 100,
        monthlyQuotes,
        currency: company.currency || 'INR' // Include company currency
      };
    } catch (error) {
      console.error(`Service error - getCompanyAnalytics(${companyId}):`, error);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}