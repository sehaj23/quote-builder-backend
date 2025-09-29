import { QuoteService } from '@/services/QuoteService.js';
export class QuoteController {
    quoteService;
    constructor() {
        this.quoteService = new QuoteService();
    }
    async getQuotesByCompany(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            const quotes = await this.quoteService.getQuotesByCompany(companyId, limit, offset);
            res.json({
                success: true,
                data: quotes,
                message: `Found ${quotes.length} quotes for company ${companyId}`
            });
        }
        catch (error) {
            console.error('Error in QuoteController.getQuotesByCompany:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    async getQuoteById(req, res) {
        try {
            const quoteId = parseInt(req.params.id);
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            const quote = await this.quoteService.getQuoteById(quoteId);
            if (!quote) {
                res.status(404).json({
                    success: false,
                    error: 'Quote not found'
                });
                return;
            }
            res.json({
                success: true,
                data: quote,
                message: 'Quote retrieved successfully'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.getQuoteById:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    async createQuote(req, res) {
        try {
            const quoteData = req.body;
            const result = await this.quoteService.createQuote(quoteData);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Quote created successfully'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.createQuote:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create quote'
            });
        }
    }
    async updateQuote(req, res) {
        try {
            const quoteId = parseInt(req.params.id);
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            const quoteData = req.body;
            const updatedQuote = await this.quoteService.updateQuote(quoteId, quoteData);
            if (!updatedQuote) {
                res.status(404).json({
                    success: false,
                    error: 'Quote not found'
                });
                return;
            }
            res.json({
                success: true,
                data: updatedQuote,
                message: 'Quote updated successfully'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.updateQuote:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update quote'
            });
        }
    }
    async deleteQuote(req, res) {
        try {
            const quoteId = parseInt(req.params.id);
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            const deleted = await this.quoteService.deleteQuote(quoteId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Quote not found'
                });
                return;
            }
            res.json({
                success: true,
                data: null,
                message: 'Quote deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.deleteQuote:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete quote'
            });
        }
    }
    async searchQuotes(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            const query = req.query.query;
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            if (!query) {
                res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
                return;
            }
            const quotes = await this.quoteService.searchQuotes(companyId, query);
            res.json({
                success: true,
                data: quotes,
                message: `Found ${quotes.length} quotes matching "${query}"`
            });
        }
        catch (error) {
            console.error('Error in QuoteController.searchQuotes:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search quotes'
            });
        }
    }
    async duplicateQuote(req, res) {
        try {
            const quoteId = parseInt(req.params.id);
            const { newTier } = req.body;
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            const result = await this.quoteService.duplicateQuote(quoteId, newTier);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Quote duplicated successfully'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.duplicateQuote:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to duplicate quote'
            });
        }
    }
    async updateQuoteStatus(req, res) {
        try {
            const quoteId = parseInt(req.params.id);
            const { status } = req.body;
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            if (!status) {
                res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
                return;
            }
            const updated = await this.quoteService.updateQuoteStatus(quoteId, status);
            if (!updated) {
                res.status(404).json({
                    success: false,
                    error: 'Quote not found'
                });
                return;
            }
            res.json({
                success: true,
                data: { id: quoteId, status },
                message: `Quote status updated to ${status}`
            });
        }
        catch (error) {
            console.error('Error in QuoteController.updateQuoteStatus:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update quote status'
            });
        }
    }
}
//# sourceMappingURL=QuoteController.js.map