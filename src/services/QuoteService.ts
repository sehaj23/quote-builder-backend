import { Quote, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '../types/index.js';
import { QuoteRepository } from '../repositories/QuoteRepository.js';

export class QuoteService {
  constructor(private quoteRepository: QuoteRepository) {}

  private async generateUniqueQuoteNumber(companyId: number): Promise<string> {
    // Get company to use proper quote numbering
    const companyRepository = (await import('../repositories/CompanyRepository.js')).CompanyRepository;
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

  async getQuotesByCompanyPaginated(
    companyId: number, 
    page: number, 
    pageSize: number, 
    filters: { search?: string; status?: string; tier?: string }
  ): Promise<{ quotes: Quote[]; totalCount: number }> {
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
        if (line && line.quantity !== undefined && line.quantity < 0) {
          throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
        }
        if (line && line.unit_rate !== undefined && line.unit_rate < 0) {
          throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
        }
        if (line && line.line_total !== undefined && line.line_total < 0) {
          throw new Error(`Line ${i + 1}: Line total cannot be negative`);
        }
        const itemName = (line as any).item_name as string | undefined;
        if (itemName && itemName.length > 255) {
          throw new Error(`Line ${i + 1}: item_name must be ≤ 255 characters`);
        }
        const itemUnitMeta = (line as any).item_unit as string | undefined;
        if (itemUnitMeta && itemUnitMeta.length > 50) {
          throw new Error(`Line ${i + 1}: item_unit must be ≤ 50 characters`);
        }
        const itemCategoryMeta = (line as any).item_category as string | undefined;
        if (itemCategoryMeta && itemCategoryMeta.length > 100) {
          throw new Error(`Line ${i + 1}: item_category must be ≤ 100 characters`);
        }
        // Section fields validation
        const sectionKey = (line as any).section_key as string | undefined;
        const sectionIndex = (line as any).section_index as number | undefined;
        const sectionLabel = (line as any).section_label as string | undefined;
        if (sectionKey && sectionKey.length > 100) {
          throw new Error(`Line ${i + 1}: section_key must be ≤ 100 characters`);
        }
        if (sectionLabel && sectionLabel.length > 150) {
          throw new Error(`Line ${i + 1}: section_label must be ≤ 150 characters`);
        }
        if (sectionIndex !== undefined && sectionIndex !== null) {
          if (typeof sectionIndex !== 'number' || sectionIndex < 1) {
            throw new Error(`Line ${i + 1}: section_index must be an integer ≥ 1`);
          }
        }
        const sortOrder = (line as any).sort_order as number | undefined;
        if (sortOrder !== undefined && sortOrder !== null) {
          if (!Number.isInteger(sortOrder) || sortOrder < 1) {
            throw new Error(`Line ${i + 1}: sort_order must be an integer ≥ 1`);
          }
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
    const discountAmount = parseFloat(quoteData.discount?.toString() || '0') || 0;
    const discountType = quoteData.discount_type || 'fixed';
    const designFeeAmount = parseFloat(quoteData.design_fee?.toString() || '0') || 0;
    const designFeeType = quoteData.design_fee_type || 'fixed';
    const handlingFeeAmount = parseFloat(quoteData.handling_fee?.toString() || '0') || 0;
    const handlingFeeType = quoteData.handling_fee_type || 'fixed';
    
    // Calculate discount based on type
    let calculatedDiscount = 0;
    let calculatedDesignFee = 0;
    let calculatedHandlingFee = 0;
    if (discountAmount > 0) {
      if (discountType === 'percentage') {
        // For percentage, calculate discount as percentage of subtotal
        calculatedDiscount = (calculatedSubtotal * discountAmount) / 100;
      } else {
        // For fixed, use the discount amount directly
        calculatedDiscount = discountAmount;
      }
    }
    if (designFeeAmount > 0) {
      if (designFeeType === 'percentage') {
        calculatedDesignFee = (calculatedSubtotal * designFeeAmount) / 100;
      } else {
        calculatedDesignFee = designFeeAmount;
      }
    }
    if (handlingFeeAmount > 0) {
      if (handlingFeeType === 'percentage') {
        calculatedHandlingFee = (calculatedSubtotal * handlingFeeAmount) / 100;
      } else {
        calculatedHandlingFee = handlingFeeAmount;
      }
    }
    
    const calculatedTotal = parseFloat(calculatedSubtotal?.toString() || '0') + parseFloat(calculatedTax?.toString() || '0') + calculatedDesignFee + calculatedHandlingFee - calculatedDiscount;

    // Sanitize input data
    const sanitizedData: CreateQuoteRequest = {
      company_id: quoteData.company_id,
      quote_number: finalQuoteNumber,
      tier: quoteData.tier || 'economy',
      status: quoteData.status || 'draft',
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: discountAmount, // Store the original discount amount, not the calculated discount
      discount_type: discountType,
      design_fee: designFeeAmount,
      design_fee_type: designFeeType,
      handling_fee: handlingFeeAmount,
      handling_fee_type: handlingFeeType,
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
        if (line && line.quantity !== undefined && line.quantity < 0) {
          throw new Error(`Line ${i + 1}: Quantity cannot be negative`);
        }
        if (line && line.unit_rate !== undefined && line.unit_rate < 0) {
          throw new Error(`Line ${i + 1}: Unit rate cannot be negative`);
        }
        if (line && line.line_total !== undefined && line.line_total < 0) {
          throw new Error(`Line ${i + 1}: Line total cannot be negative`);
        }
        const itemName = (line as any).item_name as string | undefined;
        if (itemName && itemName.length > 255) {
          throw new Error(`Line ${i + 1}: item_name must be ≤ 255 characters`);
        }
        const itemUnitMeta = (line as any).item_unit as string | undefined;
        if (itemUnitMeta && itemUnitMeta.length > 50) {
          throw new Error(`Line ${i + 1}: item_unit must be ≤ 50 characters`);
        }
        const itemCategoryMeta = (line as any).item_category as string | undefined;
        if (itemCategoryMeta && itemCategoryMeta.length > 100) {
          throw new Error(`Line ${i + 1}: item_category must be ≤ 100 characters`);
        }
        // Section fields validation
        const sectionKey = (line as any).section_key as string | undefined;
        const sectionIndex = (line as any).section_index as number | undefined;
        const sectionLabel = (line as any).section_label as string | undefined;
        if (sectionKey && sectionKey.length > 100) {
          throw new Error(`Line ${i + 1}: section_key must be ≤ 100 characters`);
        }
        if (sectionLabel && sectionLabel.length > 150) {
          throw new Error(`Line ${i + 1}: section_label must be ≤ 150 characters`);
        }
        if (sectionIndex !== undefined && sectionIndex !== null) {
          if (typeof sectionIndex !== 'number' || sectionIndex < 1) {
            throw new Error(`Line ${i + 1}: section_index must be an integer ≥ 1`);
          }
        }
        const sortOrder = (line as any).sort_order as number | undefined;
        if (sortOrder !== undefined && sortOrder !== null) {
          if (!Number.isInteger(sortOrder) || sortOrder < 1) {
            throw new Error(`Line ${i + 1}: sort_order must be an integer ≥ 1`);
          }
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
    let calculatedSubtotal, calculatedTax, calculatedDiscount, calculatedDesignFee, calculatedHandlingFee, calculatedTotal;
    if (quoteData.lines !== undefined) {
      const calculateTotalsFromLines = (lines: any[]) => {
        return lines.reduce((sum, line) => {
          const lineTotal = parseFloat(line.line_total) || 0;
          return sum + lineTotal;
        }, 0);
      };

      calculatedSubtotal = quoteData.subtotal ?? calculateTotalsFromLines(quoteData.lines);
      calculatedTax = quoteData.tax ?? 0;
      const discountAmount = quoteData.discount ?? 0;
      const discountType = quoteData.discount_type ?? 'fixed';
      const designFeeAmount = quoteData.design_fee ?? 0;
      const designFeeType = quoteData.design_fee_type ?? 'fixed';
      const handlingFeeAmount = quoteData.handling_fee ?? 0;
      const handlingFeeType = quoteData.handling_fee_type ?? 'fixed';
      
      // Calculate discount based on type
      if (discountAmount > 0) {
        if (discountType === 'percentage') {
          calculatedDiscount = (calculatedSubtotal * discountAmount) / 100;
        } else {
          calculatedDiscount = discountAmount;
        }
      } else {
        calculatedDiscount = 0;
      }
      if (designFeeAmount > 0) {
        if (designFeeType === 'percentage') {
          calculatedDesignFee = (calculatedSubtotal * designFeeAmount) / 100;
        } else {
          calculatedDesignFee = designFeeAmount;
        }
      } else {
        calculatedDesignFee = 0;
      }
      if (handlingFeeAmount > 0) {
        if (handlingFeeType === 'percentage') {
          calculatedHandlingFee = (calculatedSubtotal * handlingFeeAmount) / 100;
        } else {
          calculatedHandlingFee = handlingFeeAmount;
        }
      } else {
        calculatedHandlingFee = 0;
      }

      calculatedTotal = calculatedSubtotal + calculatedTax + (calculatedDesignFee || 0) + (calculatedHandlingFee || 0) - (calculatedDiscount || 0);
    } else {
      // If no lines are being updated, but we have subtotal/tax/discount/fee changes, recalculate total
      if (
        quoteData.subtotal !== undefined ||
        quoteData.tax !== undefined ||
        quoteData.discount !== undefined ||
        quoteData.discount_type !== undefined ||
        quoteData.design_fee !== undefined ||
        quoteData.design_fee_type !== undefined ||
        quoteData.handling_fee !== undefined ||
        quoteData.handling_fee_type !== undefined
      ) {
        // Get current quote to get missing values
        const currentQuote = await this.quoteRepository.findById(id);
        if (currentQuote) {
          const subtotal = quoteData.subtotal !== undefined ? quoteData.subtotal : parseFloat(currentQuote.subtotal?.toString() || '0');
          const tax = quoteData.tax !== undefined ? quoteData.tax : parseFloat(currentQuote.tax?.toString() || '0');
          const discountAmount = quoteData.discount !== undefined ? quoteData.discount : parseFloat(currentQuote.discount?.toString() || '0');
          const discountType = quoteData.discount_type !== undefined ? quoteData.discount_type : (currentQuote.discount_type || 'fixed');
          const designFeeAmount = quoteData.design_fee !== undefined ? quoteData.design_fee : parseFloat((currentQuote as any).design_fee?.toString() || '0');
          const designFeeType = quoteData.design_fee_type !== undefined ? quoteData.design_fee_type : ((currentQuote as any).design_fee_type || 'fixed');
          const handlingFeeAmount = quoteData.handling_fee !== undefined ? quoteData.handling_fee : parseFloat((currentQuote as any).handling_fee?.toString() || '0');
          const handlingFeeType = quoteData.handling_fee_type !== undefined ? quoteData.handling_fee_type : ((currentQuote as any).handling_fee_type || 'fixed');
          
          // Calculate discount based on type
          let actualDiscount = 0;
          if (discountAmount > 0) {
            if (discountType === 'percentage') {
              actualDiscount = (subtotal * discountAmount) / 100;
            } else {
              actualDiscount = discountAmount;
            }
          }
          let actualDesignFee = 0;
          if (designFeeAmount > 0) {
            if (designFeeType === 'percentage') {
              actualDesignFee = (subtotal * designFeeAmount) / 100;
            } else {
              actualDesignFee = designFeeAmount;
            }
          }
          let actualHandlingFee = 0;
          if (handlingFeeAmount > 0) {
            if (handlingFeeType === 'percentage') {
              actualHandlingFee = (subtotal * handlingFeeAmount) / 100;
            } else {
              actualHandlingFee = handlingFeeAmount;
            }
          }

          calculatedTotal = subtotal + tax + actualDesignFee + actualHandlingFee - actualDiscount;
        }
      }
    }

    // Sanitize input data
    const sanitizedData: UpdateQuoteRequest = {};
    
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
    if (quoteData.discount !== undefined ) {
      const finalDiscount = quoteData.discount;
      if (finalDiscount !== undefined) {
        sanitizedData.discount = finalDiscount;
      }
    }
    if (quoteData.design_fee !== undefined) {
      sanitizedData.design_fee = quoteData.design_fee;
    }
    if (quoteData.design_fee_type !== undefined) {
      sanitizedData.design_fee_type = quoteData.design_fee_type;
    }
    if (quoteData.handling_fee !== undefined) {
      sanitizedData.handling_fee = quoteData.handling_fee;
    }
    if (quoteData.handling_fee_type !== undefined) {
      sanitizedData.handling_fee_type = quoteData.handling_fee_type;
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
    const companyRepository = (await import('../repositories/CompanyRepository.js')).CompanyRepository;
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