import { QuoteRepository } from '@/repositories/QuoteRepository.js';
export class QuoteService {
    quoteRepository;
    constructor() {
        this.quoteRepository = new QuoteRepository();
    }
    async getQuotesByCompany(companyId, limit, offset) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        return await this.quoteRepository.findByCompanyId(companyId, limit, offset);
    }
    async getQuoteById(id) {
        if (!id || id <= 0) {
            throw new Error('Valid quote ID is required');
        }
        return await this.quoteRepository.findByIdWithLines(id);
    }
    async createQuote(quoteData) {
        if (!quoteData.company_id || quoteData.company_id <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!quoteData.quote_number || quoteData.quote_number.trim().length === 0) {
            throw new Error('Quote number is required');
        }
        if (quoteData.lines && quoteData.lines.length > 0) {
            for (let i = 0; i < quoteData.lines.length; i++) {
                const line = quoteData.lines[i];
                if (line.quantity !== undefined && line.quantity < 0) {
                    throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
                }
                if (line.unit_rate !== undefined && line.unit_rate < 0) {
                    throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
                }
                if (line.line_total !== undefined && line.line_total < 0) {
                    throw new Error(`Line ${i + 1}: Line total cannot be negative`);
                }
            }
        }
        if (quoteData.subtotal !== undefined && quoteData.subtotal < 0) {
            throw new Error('Subtotal cannot be negative');
        }
        if (quoteData.tax !== undefined && quoteData.tax < 0) {
            throw new Error('Tax cannot be negative');
        }
        if (quoteData.discount !== undefined && quoteData.discount < 0) {
            throw new Error('Discount cannot be negative');
        }
        if (quoteData.total !== undefined && quoteData.total < 0) {
            throw new Error('Total cannot be negative');
        }
        const sanitizedData = {
            ...quoteData,
            quote_number: quoteData.quote_number.trim(),
            project_name: quoteData.project_name?.trim() || null,
            customer_name: quoteData.customer_name?.trim() || null,
            customer_email: quoteData.customer_email?.trim() || null,
            customer_mobile: quoteData.customer_mobile?.trim() || null,
            tier: quoteData.tier || 'economy',
            status: quoteData.status || 'draft',
            subtotal: quoteData.subtotal || 0,
            tax: quoteData.tax || 0,
            discount: quoteData.discount || 0,
            total: quoteData.total || 0,
            lines: quoteData.lines || []
        };
        if (sanitizedData.customer_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedData.customer_email)) {
                throw new Error('Invalid email format');
            }
        }
        try {
            const newQuoteId = await this.quoteRepository.create(sanitizedData);
            const newQuote = await this.quoteRepository.findByIdWithLines(newQuoteId);
            if (!newQuote) {
                throw new Error('Failed to retrieve created quote');
            }
            return {
                id: newQuoteId,
                quote: newQuote
            };
        }
        catch (error) {
            console.error('Error in QuoteService.createQuote:', error);
            throw error;
        }
    }
    async updateQuote(id, quoteData) {
        if (!id || id <= 0) {
            throw new Error('Valid quote ID is required');
        }
        const existingQuote = await this.quoteRepository.findById(id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }
        if (quoteData.quote_number !== undefined && quoteData.quote_number.trim().length === 0) {
            throw new Error('Quote number cannot be empty');
        }
        if (quoteData.lines && quoteData.lines.length > 0) {
            for (let i = 0; i < quoteData.lines.length; i++) {
                const line = quoteData.lines[i];
                if (line.quantity !== undefined && line.quantity < 0) {
                    throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
                }
                if (line.unit_rate !== undefined && line.unit_rate < 0) {
                    throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
                }
                if (line.line_total !== undefined && line.line_total < 0) {
                    throw new Error(`Line ${i + 1}: Line total cannot be negative`);
                }
            }
        }
        if (quoteData.subtotal !== undefined && quoteData.subtotal < 0) {
            throw new Error('Subtotal cannot be negative');
        }
        if (quoteData.tax !== undefined && quoteData.tax < 0) {
            throw new Error('Tax cannot be negative');
        }
        if (quoteData.discount !== undefined && quoteData.discount < 0) {
            throw new Error('Discount cannot be negative');
        }
        if (quoteData.total !== undefined && quoteData.total < 0) {
            throw new Error('Total cannot be negative');
        }
        const sanitizedData = {};
        if (quoteData.quote_number !== undefined) {
            sanitizedData.quote_number = quoteData.quote_number.trim();
        }
        if (quoteData.project_name !== undefined) {
            sanitizedData.project_name = quoteData.project_name?.trim() || null;
        }
        if (quoteData.customer_name !== undefined) {
            sanitizedData.customer_name = quoteData.customer_name?.trim() || null;
        }
        if (quoteData.customer_email !== undefined) {
            sanitizedData.customer_email = quoteData.customer_email?.trim() || null;
        }
        if (quoteData.customer_mobile !== undefined) {
            sanitizedData.customer_mobile = quoteData.customer_mobile?.trim() || null;
        }
        if (quoteData.tier !== undefined) {
            sanitizedData.tier = quoteData.tier;
        }
        if (quoteData.status !== undefined) {
            sanitizedData.status = quoteData.status;
        }
        if (quoteData.subtotal !== undefined) {
            sanitizedData.subtotal = quoteData.subtotal;
        }
        if (quoteData.tax !== undefined) {
            sanitizedData.tax = quoteData.tax;
        }
        if (quoteData.discount !== undefined) {
            sanitizedData.discount = quoteData.discount;
        }
        if (quoteData.total !== undefined) {
            sanitizedData.total = quoteData.total;
        }
        if (quoteData.lines !== undefined) {
            sanitizedData.lines = quoteData.lines;
        }
        if (sanitizedData.customer_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedData.customer_email)) {
                throw new Error('Invalid email format');
            }
        }
        try {
            const updateSuccess = await this.quoteRepository.update(id, sanitizedData);
            if (!updateSuccess) {
                throw new Error('Failed to update quote');
            }
            return await this.quoteRepository.findByIdWithLines(id);
        }
        catch (error) {
            console.error('Error in QuoteService.updateQuote:', error);
            throw error;
        }
    }
    async deleteQuote(id) {
        if (!id || id <= 0) {
            throw new Error('Valid quote ID is required');
        }
        const existingQuote = await this.quoteRepository.findById(id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }
        try {
            return await this.quoteRepository.delete(id);
        }
        catch (error) {
            console.error('Error in QuoteService.deleteQuote:', error);
            throw error;
        }
    }
    async searchQuotes(companyId, query) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!query || query.trim().length < 2) {
            throw new Error('Search query must be at least 2 characters');
        }
        return await this.quoteRepository.search(companyId, query.trim());
    }
    async duplicateQuote(id, newTier) {
        if (!id || id <= 0) {
            throw new Error('Valid quote ID is required');
        }
        const originalQuote = await this.quoteRepository.findById(id);
        if (!originalQuote) {
            throw new Error('Original quote not found');
        }
        const timestamp = Date.now();
        const newQuoteNumber = `${originalQuote.quote_number}-COPY-${timestamp}`;
        try {
            const newQuoteId = await this.quoteRepository.duplicate(id, newQuoteNumber, newTier);
            const newQuote = await this.quoteRepository.findByIdWithLines(newQuoteId);
            if (!newQuote) {
                throw new Error('Failed to retrieve duplicated quote');
            }
            return {
                id: newQuoteId,
                quote: newQuote
            };
        }
        catch (error) {
            console.error('Error in QuoteService.duplicateQuote:', error);
            throw error;
        }
    }
    async updateQuoteStatus(id, status) {
        if (!id || id <= 0) {
            throw new Error('Valid quote ID is required');
        }
        const validStatuses = ['draft', 'sent', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status. Must be: draft, sent, approved, or rejected');
        }
        const existingQuote = await this.quoteRepository.findById(id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }
        try {
            return await this.quoteRepository.updateStatus(id, status);
        }
        catch (error) {
            console.error('Error in QuoteService.updateQuoteStatus:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=QuoteService.js.map