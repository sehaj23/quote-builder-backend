import { Quote, QuoteLine, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '@/types/index.js';
import { QuoteRepository } from '@/repositories/QuoteRepository.js';

export class QuoteService {
  private quoteRepository: QuoteRepository;

  constructor() {
    this.quoteRepository = new QuoteRepository();
  }

  private async generateUniqueQuoteNumber(companyId: number): Promise<string> {
    // Get company to use proper quote numbering
    const companyRepository = (await import('@/repositories/CompanyRepository.js')).CompanyRepository;
    const companyRepo = new companyRepository();
    const company = await companyRepo.findById(companyId);
    
    if (!company) {
      throw new Error('Company not found for quote number generation');
    }

    // Generate new quote number using company's prefix and next available number
    const prefix = company.quote_prefix || 'QTE';
    let nextNumber = company.next_quote_number || 100;
    let newQuoteNumber = `${prefix}-${nextNumber}`;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    // Find next available quote number
    while (attempts < maxAttempts) {
      try {
        // Check if this quote number already exists for this company
        const existingQuote = await this.quoteRepository.findByCompanyAndQuoteNumber(companyId, newQuoteNumber);
        if (!existingQuote) {
          // Quote number is available, update company's next_quote_number
          try {
            await companyRepo.update(company.id!, { next_quote_number: nextNumber + 1 });
            console.log(`Generated quote number: ${newQuoteNumber}, updated company next_quote_number to ${nextNumber + 1}`);
          } catch (incrementError) {
            console.warn('Failed to increment company quote number:', incrementError);
            // Continue with generated number even if increment fails
          }
          return newQuoteNumber;
        }
        
        // Quote number exists, try next one
        nextNumber++;
        newQuoteNumber = `${prefix}-${nextNumber}`;
        attempts++;
        console.log(`Quote number ${prefix}-${nextNumber - 1} exists, trying ${newQuoteNumber}`);
      } catch (error) {
        console.error('Error checking quote number availability:', error);
        // If error checking, use timestamp-based fallback
        return `${prefix}-${Date.now()}`;
      }
    }

    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based number
      return `${prefix}-${Date.now()}`;
    }

    return newQuoteNumber;
  }

  async getQuotesByCompany(companyId: number, limit?: number, offset?: number): Promise<Quote[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    return await this.quoteRepository.findByCompanyId(companyId, limit, offset);
  }

  async getQuoteById(id: number): Promise<QuoteWithLines | null> {
    if (!id || id <= 0) {
      throw new Error('Valid quote ID is required');
    }

    return await this.quoteRepository.findByIdWithLines(id);
  }

  async createQuote(quoteData: CreateQuoteRequest): Promise<{ id: number; quote: QuoteWithLines }> {
    // Validate required fields
    if (!quoteData.company_id || quoteData.company_id <= 0) {
      throw new Error('Valid company ID is required');
    }

    // Auto-generate quote number if not provided
    let finalQuoteNumber = quoteData.quote_number;
    if (!finalQuoteNumber || finalQuoteNumber.trim().length === 0) {
      finalQuoteNumber = await this.generateUniqueQuoteNumber(quoteData.company_id);
    } else {
      finalQuoteNumber = finalQuoteNumber.trim();
    }

    // Validate quote lines if provided
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

    // Validate totals
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

    // Calculate totals from line items if not provided or invalid
    const calculateTotalsFromLines = (lines: any[]) => {
      return lines.reduce((sum, line) => {
        const lineTotal = parseFloat(line.line_total) || 0;
        return sum + lineTotal;
      }, 0);
    };

    // Use provided totals or calculate from line items
    const calculatedSubtotal = quoteData.subtotal || calculateTotalsFromLines(quoteData.lines || []);
    const calculatedTax = quoteData.tax || 0;
    const calculatedDiscount = quoteData.discount || 0;
    const calculatedTotal = calculatedSubtotal + calculatedTax - calculatedDiscount;

    // Sanitize input data
    const sanitizedData: CreateQuoteRequest = {
      ...quoteData,
      quote_number: finalQuoteNumber,
      project_name: quoteData.project_name?.trim() || null,
      customer_name: quoteData.customer_name?.trim() || null,
      customer_email: quoteData.customer_email?.trim() || null,
      customer_mobile: quoteData.customer_mobile?.trim() || null,
      tier: quoteData.tier || 'economy',
      status: quoteData.status || 'draft',
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscount,
      total: calculatedTotal,
      lines: quoteData.lines || []
    };

    // Validate email format if provided
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
    } catch (error) {
      console.error('Error in QuoteService.createQuote:', error);
      throw error;
    }
  }

  async updateQuote(id: number, quoteData: UpdateQuoteRequest): Promise<QuoteWithLines | null> {
    if (!id || id <= 0) {
      throw new Error('Valid quote ID is required');
    }

    // Check if quote exists
    const existingQuote = await this.quoteRepository.findById(id);
    if (!existingQuote) {
      throw new Error('Quote not found');
    }

    // Validate updated fields
    if (quoteData.quote_number !== undefined && quoteData.quote_number.trim().length === 0) {
      throw new Error('Quote number cannot be empty');
    }

    // Validate quote lines if provided
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

    // Validate totals
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

    // Calculate totals from line items if lines are being updated
    let calculatedSubtotal, calculatedTax, calculatedDiscount, calculatedTotal;
    if (quoteData.lines !== undefined) {
      const calculateTotalsFromLines = (lines: any[]) => {
        return lines.reduce((sum, line) => {
          const lineTotal = parseFloat(line.line_total) || 0;
          return sum + lineTotal;
        }, 0);
      };

      calculatedSubtotal = quoteData.subtotal ?? calculateTotalsFromLines(quoteData.lines);
      calculatedTax = quoteData.tax ?? 0;
      calculatedDiscount = quoteData.discount ?? 0;
      calculatedTotal = calculatedSubtotal + calculatedTax - calculatedDiscount;
    } else {
      // If no lines are being updated, but we have subtotal/tax/discount changes, recalculate total
      if (quoteData.subtotal !== undefined || quoteData.tax !== undefined || quoteData.discount !== undefined) {
        // Get current quote to get missing values
        const currentQuote = await this.quoteRepository.findById(id);
        if (currentQuote) {
          const subtotal = quoteData.subtotal !== undefined ? quoteData.subtotal : parseFloat(currentQuote.subtotal?.toString() || '0');
          const tax = quoteData.tax !== undefined ? quoteData.tax : parseFloat(currentQuote.tax?.toString() || '0');
          const discount = quoteData.discount !== undefined ? quoteData.discount : parseFloat(currentQuote.discount?.toString() || '0');
          calculatedTotal = subtotal + tax - discount;
        }
      }
    }

    // Sanitize input data
    const sanitizedData: UpdateQuoteRequest = {};
    
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
    if (quoteData.subtotal !== undefined || calculatedSubtotal !== undefined) {
      sanitizedData.subtotal = calculatedSubtotal ?? quoteData.subtotal;
    }
    if (quoteData.tax !== undefined || calculatedTax !== undefined) {
      sanitizedData.tax = calculatedTax ?? quoteData.tax;
    }
    if (quoteData.discount !== undefined || calculatedDiscount !== undefined) {
      sanitizedData.discount = calculatedDiscount ?? quoteData.discount;
    }
    if (quoteData.total !== undefined || calculatedTotal !== undefined) {
      sanitizedData.total = calculatedTotal ?? quoteData.total;
    }
    if (quoteData.lines !== undefined) {
      sanitizedData.lines = quoteData.lines;
    }

    // Validate email format if provided
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
    } catch (error) {
      console.error('Error in QuoteService.updateQuote:', error);
      throw error;
    }
  }

  async deleteQuote(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Valid quote ID is required');
    }

    // Check if quote exists
    const existingQuote = await this.quoteRepository.findById(id);
    if (!existingQuote) {
      throw new Error('Quote not found');
    }

    try {
      return await this.quoteRepository.delete(id);
    } catch (error) {
      console.error('Error in QuoteService.deleteQuote:', error);
      throw error;
    }
  }

  async searchQuotes(companyId: number, query: string): Promise<Quote[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return await this.quoteRepository.search(companyId, query.trim());
  }

  async duplicateQuote(id: number, newTier?: string): Promise<{ id: number; quote: QuoteWithLines }> {
    if (!id || id <= 0) {
      throw new Error('Valid quote ID is required');
    }

    // Check if original quote exists
    const originalQuote = await this.quoteRepository.findById(id);
    if (!originalQuote) {
      throw new Error('Original quote not found');
    }

    // Get company to use proper quote numbering
    const companyRepository = (await import('@/repositories/CompanyRepository.js')).CompanyRepository;
    const companyRepo = new companyRepository();
    const company = await companyRepo.findById(originalQuote.company_id);
    
    if (!company) {
      throw new Error('Company not found for quote');
    }

    // Generate new quote number using company's prefix and next available number
    const prefix = company.quote_prefix || 'QTE';
    let nextNumber = company.next_quote_number || 100;
    let newQuoteNumber = `${prefix}-${nextNumber}`;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    // Find next available quote number
    while (attempts < maxAttempts) {
      try {
        // Check if this quote number already exists for this company
        const existingQuote = await this.quoteRepository.findByCompanyAndQuoteNumber(originalQuote.company_id, newQuoteNumber);
        if (!existingQuote) {
          // Quote number is available
          break;
        }
        
        // Quote number exists, try next one
        nextNumber++;
        newQuoteNumber = `${prefix}-${nextNumber}`;
        attempts++;
        console.log(`Quote number ${prefix}-${nextNumber - 1} exists, trying ${newQuoteNumber}`);
      } catch (error) {
        console.error('Error checking quote number availability:', error);
        break; // If error checking, proceed with current number
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique quote number after maximum attempts');
    }

    try {
      const newQuoteId = await this.quoteRepository.duplicate(id, newQuoteNumber, newTier);
      
      // Update the company's next quote number to the one after the used number
      try {
        await companyRepo.update(company.id!, { next_quote_number: nextNumber + 1 });
        console.log(`Updated company next_quote_number to ${nextNumber + 1}`);
      } catch (incrementError) {
        console.warn('Failed to increment company quote number:', incrementError);
        // Continue with duplication even if increment fails
      }
      
      const newQuote = await this.quoteRepository.findByIdWithLines(newQuoteId);
      
      if (!newQuote) {
        throw new Error('Failed to retrieve duplicated quote');
      }

      return {
        id: newQuoteId,
        quote: newQuote
      };
    } catch (error) {
      console.error('Error in QuoteService.duplicateQuote:', error);
      throw error;
    }
  }

  async updateQuoteStatus(id: number, status: string): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Valid quote ID is required');
    }

    const validStatuses = ['draft', 'sent', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be: draft, sent, approved, or rejected');
    }

    // Check if quote exists
    const existingQuote = await this.quoteRepository.findById(id);
    if (!existingQuote) {
      throw new Error('Quote not found');
    }

    try {
      return await this.quoteRepository.updateStatus(id, status);
    } catch (error) {
      console.error('Error in QuoteService.updateQuoteStatus:', error);
      throw error;
    }
  }
}