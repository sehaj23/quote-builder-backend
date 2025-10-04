export class CompanyService {
    companyRepository;
    quoteRepository;
    constructor(companyRepository, quoteRepository) {
        this.companyRepository = companyRepository;
        this.quoteRepository = quoteRepository;
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
            }
            else {
                sanitizedData.currency = 'INR';
            }
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
    async incrementQuoteNumber(companyId) {
        try {
            if (!companyId || companyId <= 0) {
                throw new Error('Invalid company ID provided');
            }
            const existingCompany = await this.companyRepository.findById(companyId);
            if (!existingCompany) {
                throw new Error('Company not found');
            }
            const currentNumber = existingCompany.next_quote_number || 100;
            const newNextNumber = currentNumber + 1;
            await this.companyRepository.update(companyId, {
                next_quote_number: newNextNumber
            });
            return newNextNumber;
        }
        catch (error) {
            console.error(`Service error - incrementQuoteNumber(${companyId}):`, error);
            throw error;
        }
    }
    async getCompanyAnalytics(companyId) {
        try {
            if (!companyId || companyId <= 0) {
                throw new Error('Invalid company ID provided');
            }
            const company = await this.companyRepository.findById(companyId);
            if (!company) {
                throw new Error('Company not found');
            }
            const quotes = await this.quoteRepository.findByCompanyId(companyId);
            const totalQuotes = quotes.length;
            const quotesByStatus = {
                draft: 0,
                sent: 0,
                approved: 0,
                rejected: 0
            };
            let totalRevenue = 0;
            const monthlyData = {};
            quotes.forEach(quote => {
                if (quote.status && quotesByStatus.hasOwnProperty(quote.status)) {
                    quotesByStatus[quote.status]++;
                }
                if (quote.status === 'approved') {
                    totalRevenue += quote.total || 0;
                }
                if (quote.created_at) {
                    const date = new Date(quote.created_at);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
                }
            });
            const averageQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;
            const monthlyQuotes = Object.entries(monthlyData)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6)
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
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                averageQuoteValue: Math.round(averageQuoteValue * 100) / 100,
                monthlyQuotes,
                currency: company.currency || 'INR'
            };
        }
        catch (error) {
            console.error(`Service error - getCompanyAnalytics(${companyId}):`, error);
            throw error;
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
//# sourceMappingURL=CompanyService.js.map