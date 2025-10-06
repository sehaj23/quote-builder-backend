export class QuoteService {
    quoteRepository;
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    async generateUniqueQuoteNumber(companyId) {
        const companyRepository = (await import('@/repositories/CompanyRepository.js')).CompanyRepository;
        const companyRepo = new companyRepository();
        const company = await companyRepo.findById(companyId);
        if (!company) {
            throw new Error('Company not found for quote number generation');
        }
        const prefix = company.quote_prefix || 'QTE';
        let nextNumber = company.next_quote_number || 100;
        let newQuoteNumber = `${prefix}-${nextNumber}`;
        let attempts = 0;
        const maxAttempts = 100;
        while (attempts < maxAttempts) {
            try {
                const existingQuote = await this.quoteRepository.findByCompanyAndQuoteNumber(companyId, newQuoteNumber);
                if (!existingQuote) {
                    try {
                        await companyRepo.update(company.id, { next_quote_number: nextNumber + 1 });
                        console.log(`Generated quote number: ${newQuoteNumber}, updated company next_quote_number to ${nextNumber + 1}`);
                    }
                    catch (incrementError) {
                        console.warn('Failed to increment company quote number:', incrementError);
                    }
                    return newQuoteNumber;
                }
                nextNumber++;
                newQuoteNumber = `${prefix}-${nextNumber}`;
                attempts++;
                console.log(`Quote number ${prefix}-${nextNumber - 1} exists, trying ${newQuoteNumber}`);
            }
            catch (error) {
                console.error('Error checking quote number availability:', error);
                return `${prefix}-${Date.now()}`;
            }
        }
        if (attempts >= maxAttempts) {
            return `${prefix}-${Date.now()}`;
        }
        return newQuoteNumber;
    }
    async getQuotesByCompany(companyId, limit, offset) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        return await this.quoteRepository.findByCompanyId(companyId, limit, offset);
    }
    async getQuotesByCompanyPaginated(companyId, page, pageSize, filters) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (page < 1 || pageSize < 1) {
            throw new Error('Page and pageSize must be positive integers');
        }
        const offset = (page - 1) * pageSize;
        const [quotes, totalCount] = await Promise.all([
            this.quoteRepository.findByCompanyIdPaginated(companyId, pageSize, offset, filters),
            this.quoteRepository.countByCompanyId(companyId, filters)
        ]);
        return {
            quotes,
            totalCount
        };
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
        let finalQuoteNumber = quoteData.quote_number;
        if (!finalQuoteNumber || finalQuoteNumber.trim().length === 0) {
            finalQuoteNumber = await this.generateUniqueQuoteNumber(quoteData.company_id);
        }
        else {
            finalQuoteNumber = finalQuoteNumber.trim();
        }
        if (quoteData.lines && quoteData.lines.length > 0) {
            for (let i = 0; i < quoteData.lines.length; i++) {
                const line = quoteData.lines[i];
                if (line && line.quantity !== undefined && line.quantity < 0) {
                    throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
                }
                if (line && line.unit_rate !== undefined && line.unit_rate < 0) {
                    throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
                }
                if (line && line.line_total !== undefined && line.line_total < 0) {
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
        const calculateTotalsFromLines = (lines) => {
            return lines.reduce((sum, line) => {
                const lineTotal = parseFloat(line.line_total) || 0;
                return sum + lineTotal;
            }, 0);
        };
        const calculatedSubtotal = quoteData.subtotal || calculateTotalsFromLines(quoteData.lines || []);
        const calculatedTax = quoteData.tax || 0;
        const discountAmount = parseFloat(quoteData.discount?.toString() || '0') || 0;
        const discountType = quoteData.discount_type || 'fixed';
        let calculatedDiscount = 0;
        if (discountAmount > 0) {
            if (discountType === 'percentage') {
                calculatedDiscount = (calculatedSubtotal * discountAmount) / 100;
            }
            else {
                calculatedDiscount = discountAmount;
            }
        }
        const calculatedTotal = parseFloat(calculatedSubtotal?.toString() || '0') + parseFloat(calculatedTax?.toString() || '0') - calculatedDiscount;
        const sanitizedData = {
            company_id: quoteData.company_id,
            quote_number: finalQuoteNumber,
            tier: quoteData.tier || 'economy',
            status: quoteData.status || 'draft',
            subtotal: calculatedSubtotal,
            tax: calculatedTax,
            discount: discountAmount,
            discount_type: discountType,
            total: calculatedTotal,
            lines: quoteData.lines || []
        };
        if (quoteData.project_name?.trim()) {
            sanitizedData.project_name = quoteData.project_name.trim();
        }
        if (quoteData.customer_name?.trim()) {
            sanitizedData.customer_name = quoteData.customer_name.trim();
        }
        if (quoteData.customer_email?.trim()) {
            sanitizedData.customer_email = quoteData.customer_email.trim();
        }
        if (quoteData.customer_mobile?.trim()) {
            sanitizedData.customer_mobile = quoteData.customer_mobile.trim();
        }
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
                if (line && line.quantity !== undefined && line.quantity < 0) {
                    throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
                }
                if (line && line.unit_rate !== undefined && line.unit_rate < 0) {
                    throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
                }
                if (line && line.line_total !== undefined && line.line_total < 0) {
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
        let calculatedSubtotal, calculatedTax, calculatedDiscount, calculatedTotal;
        if (quoteData.lines !== undefined) {
            const calculateTotalsFromLines = (lines) => {
                return lines.reduce((sum, line) => {
                    const lineTotal = parseFloat(line.line_total) || 0;
                    return sum + lineTotal;
                }, 0);
            };
            calculatedSubtotal = quoteData.subtotal ?? calculateTotalsFromLines(quoteData.lines);
            calculatedTax = quoteData.tax ?? 0;
            const discountAmount = quoteData.discount ?? 0;
            const discountType = quoteData.discount_type ?? 'fixed';
            if (discountAmount > 0) {
                if (discountType === 'percentage') {
                    calculatedDiscount = (calculatedSubtotal * discountAmount) / 100;
                }
                else {
                    calculatedDiscount = discountAmount;
                }
            }
            else {
                calculatedDiscount = 0;
            }
            calculatedTotal = calculatedSubtotal + calculatedTax - calculatedDiscount;
        }
        else {
            if (quoteData.subtotal !== undefined || quoteData.tax !== undefined || quoteData.discount !== undefined) {
                const currentQuote = await this.quoteRepository.findById(id);
                if (currentQuote) {
                    const subtotal = quoteData.subtotal !== undefined ? quoteData.subtotal : parseFloat(currentQuote.subtotal?.toString() || '0');
                    const tax = quoteData.tax !== undefined ? quoteData.tax : parseFloat(currentQuote.tax?.toString() || '0');
                    const discountAmount = quoteData.discount !== undefined ? quoteData.discount : parseFloat(currentQuote.discount?.toString() || '0');
                    const discountType = quoteData.discount_type !== undefined ? quoteData.discount_type : (currentQuote.discount_type || 'fixed');
                    let actualDiscount = 0;
                    if (discountAmount > 0) {
                        if (discountType === 'percentage') {
                            actualDiscount = (subtotal * discountAmount) / 100;
                        }
                        else {
                            actualDiscount = discountAmount;
                        }
                    }
                    calculatedTotal = subtotal + tax - actualDiscount;
                }
            }
        }
        const sanitizedData = {};
        if (quoteData.quote_number !== undefined) {
            sanitizedData.quote_number = quoteData.quote_number.trim();
        }
        if (quoteData.project_name !== undefined) {
            if (quoteData.project_name?.trim()) {
                sanitizedData.project_name = quoteData.project_name.trim();
            }
        }
        if (quoteData.customer_name !== undefined) {
            if (quoteData.customer_name?.trim()) {
                sanitizedData.customer_name = quoteData.customer_name.trim();
            }
        }
        if (quoteData.customer_email !== undefined) {
            if (quoteData.customer_email?.trim()) {
                sanitizedData.customer_email = quoteData.customer_email.trim();
            }
        }
        if (quoteData.customer_mobile !== undefined) {
            if (quoteData.customer_mobile?.trim()) {
                sanitizedData.customer_mobile = quoteData.customer_mobile.trim();
            }
        }
        if (quoteData.tier !== undefined) {
            sanitizedData.tier = quoteData.tier;
        }
        if (quoteData.status !== undefined) {
            sanitizedData.status = quoteData.status;
        }
        if (quoteData.subtotal !== undefined || calculatedSubtotal !== undefined) {
            const finalSubtotal = calculatedSubtotal ?? quoteData.subtotal;
            if (finalSubtotal !== undefined) {
                sanitizedData.subtotal = finalSubtotal;
            }
        }
        if (quoteData.tax !== undefined || calculatedTax !== undefined) {
            const finalTax = calculatedTax ?? quoteData.tax;
            if (finalTax !== undefined) {
                sanitizedData.tax = finalTax;
            }
        }
        if (quoteData.discount !== undefined) {
            const finalDiscount = quoteData.discount;
            if (finalDiscount !== undefined) {
                sanitizedData.discount = finalDiscount;
            }
        }
        if (quoteData.total !== undefined || calculatedTotal !== undefined) {
            const finalTotal = calculatedTotal ?? quoteData.total;
            if (finalTotal !== undefined) {
                sanitizedData.total = finalTotal;
            }
        }
        if (quoteData.lines !== undefined) {
            sanitizedData.lines = quoteData.lines;
        }
        if (quoteData.discount_type !== undefined) {
            sanitizedData.discount_type = quoteData.discount_type;
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
        const companyRepository = (await import('@/repositories/CompanyRepository.js')).CompanyRepository;
        const companyRepo = new companyRepository();
        const company = await companyRepo.findById(originalQuote.company_id);
        if (!company) {
            throw new Error('Company not found for quote');
        }
        const prefix = company.quote_prefix || 'QTE';
        let nextNumber = company.next_quote_number || 100;
        let newQuoteNumber = `${prefix}-${nextNumber}`;
        let attempts = 0;
        const maxAttempts = 100;
        while (attempts < maxAttempts) {
            try {
                const existingQuote = await this.quoteRepository.findByCompanyAndQuoteNumber(originalQuote.company_id, newQuoteNumber);
                if (!existingQuote) {
                    break;
                }
                nextNumber++;
                newQuoteNumber = `${prefix}-${nextNumber}`;
                attempts++;
                console.log(`Quote number ${prefix}-${nextNumber - 1} exists, trying ${newQuoteNumber}`);
            }
            catch (error) {
                console.error('Error checking quote number availability:', error);
                break;
            }
        }
        if (attempts >= maxAttempts) {
            throw new Error('Unable to generate unique quote number after maximum attempts');
        }
        try {
            const newQuoteId = await this.quoteRepository.duplicate(id, newQuoteNumber, newTier);
            try {
                await companyRepo.update(company.id, { next_quote_number: nextNumber + 1 });
                console.log(`Updated company next_quote_number to ${nextNumber + 1}`);
            }
            catch (incrementError) {
                console.warn('Failed to increment company quote number:', incrementError);
            }
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