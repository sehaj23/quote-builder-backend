import { Request, Response } from 'express';
import { QuoteService } from '@/services/QuoteService.js';
import { CreateQuoteRequest, UpdateQuoteRequest, ApiResponse } from '@/types/index.js';

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  // GET /api/companies/:companyId/quotes
  async getQuotesByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params.companyId || '');
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const search = req.query.search as string || '';
      const status = req.query.status as string || '';
      const tier = req.query.tier as string || '';
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      if (page < 1 || pageSize < 1 || pageSize > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100'
        } as ApiResponse);
        return;
      }

      const filters = {
        search: search.trim(),
        status: status.trim(),
        tier: tier.trim()
      };

      const result = await this.quoteService.getQuotesByCompanyPaginated(companyId, page, pageSize, filters);
      
      res.json({
        success: true,
        data: {
          quotes: result.quotes,
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalItems: result.totalCount,
            totalPages: Math.ceil(result.totalCount / pageSize),
            hasNextPage: page < Math.ceil(result.totalCount / pageSize),
            hasPrevPage: page > 1
          }
        },
        message: `Found ${result.totalCount} quotes for company ${companyId}`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.getQuotesByCompany:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // GET /api/quotes/:id
  async getQuoteById(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params['id'] || '');
      
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote ID'
        } as ApiResponse);
        return;
      }

      const quote = await this.quoteService.getQuoteById(quoteId);
      
      if (!quote) {
        res.status(404).json({
          success: false,
          error: 'Quote not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: quote,
        message: 'Quote retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.getQuoteById:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // POST /api/quotes
  async createQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteData: CreateQuoteRequest = req.body;

      const result = await this.quoteService.createQuote(quoteData);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Quote created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.createQuote:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create quote'
      } as ApiResponse);
    }
  }

  // PUT /api/quotes/:id
  async updateQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params['id'] || '');
      
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote ID'
        } as ApiResponse);
        return;
      }

      const quoteData: UpdateQuoteRequest = req.body;
      const updatedQuote = await this.quoteService.updateQuote(quoteId, quoteData);
      
      if (!updatedQuote) {
        res.status(404).json({
          success: false,
          error: 'Quote not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: updatedQuote,
        message: 'Quote updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.updateQuote:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update quote'
      } as ApiResponse);
    }
  }

  // DELETE /api/quotes/:id
  async deleteQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params['id'] || '');
      
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote ID'
        } as ApiResponse);
        return;
      }

      const deleted = await this.quoteService.deleteQuote(quoteId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Quote not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: null,
        message: 'Quote deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.deleteQuote:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete quote'
      } as ApiResponse);
    }
  }

  // GET /api/companies/:companyId/quotes/search?query=...
  async searchQuotes(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      const query = req.query['query'] as string;
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        } as ApiResponse);
        return;
      }

      const quotes = await this.quoteService.searchQuotes(companyId, query);
      
      res.json({
        success: true,
        data: quotes,
        message: `Found ${quotes.length} quotes matching "${query}"`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.searchQuotes:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search quotes'
      } as ApiResponse);
    }
  }

  // POST /api/quotes/:id/duplicate
  async duplicateQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params['id'] || '');
      const { newTier } = req.body;
      
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote ID'
        } as ApiResponse);
        return;
      }

      const result = await this.quoteService.duplicateQuote(quoteId, newTier);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Quote duplicated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.duplicateQuote:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate quote'
      } as ApiResponse);
    }
  }

  // PATCH /api/quotes/:id/status
  async updateQuoteStatus(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params['id'] || '');
      const { status } = req.body;
      
      if (isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote ID'
        } as ApiResponse);
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        } as ApiResponse);
        return;
      }

      const updated = await this.quoteService.updateQuoteStatus(quoteId, status);
      
      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Quote not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: { id: quoteId, status },
        message: `Quote status updated to ${status}`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.updateQuoteStatus:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update quote status'
      } as ApiResponse);
    }
  }

  async rejectQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteId = parseInt(req.params.id);

      if (!quoteId || isNaN(quoteId)) {
        res.status(400).json({
          success: false,
          error: 'Valid quote ID is required'
        } as ApiResponse);
        return;
      }

      const updated = await this.quoteService.updateQuoteStatus(quoteId, 'rejected');
      
      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Quote not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: { id: quoteId, status: 'rejected' },
        message: 'Quote has been rejected'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in QuoteController.rejectQuote:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject quote'
      } as ApiResponse);
    }
  }
}