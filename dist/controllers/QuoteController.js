import { ActivityService } from '../services/ActivityService.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
export class QuoteController {
    quoteService;
    activityService;
    constructor(quoteService, activityService) {
        this.quoteService = quoteService;
        this.activityService = activityService || new ActivityService(new ActivityRepository());
    }
    async getQuotesByCompany(req, res) {
        try {
            const companyId = parseInt(req.params.companyId || '');
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
            const search = req.query.search || '';
            const status = req.query.status || '';
            const tier = req.query.tier || '';
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            if (page < 1 || pageSize < 1 || pageSize > 100) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100'
                });
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
            const quoteId = parseInt(req.params['id'] || '');
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
            try {
                const userId = req.user?.id;
                if (userId) {
                    await this.activityService.logActivity({
                        user_id: userId,
                        company_id: quoteData.company_id,
                        action: 'quote_created',
                        resource_type: 'quote',
                        resource_id: result.id,
                        description: `Created quote ${result.quote?.quote?.quote_number || ''}`,
                        ip_address: req.ip,
                        user_agent: req.get('User-Agent') || undefined
                    });
                }
            }
            catch (activityErr) {
                console.warn('Activity logging failed (quote_created):', activityErr);
            }
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
            const quoteId = parseInt(req.params['id'] || '');
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
            try {
                const userId = req.user?.id;
                if (userId) {
                    const companyId = updatedQuote.quote?.company_id || undefined;
                    await this.activityService.logActivity({
                        user_id: userId,
                        company_id: companyId,
                        action: 'quote_updated',
                        resource_type: 'quote',
                        resource_id: updatedQuote.quote?.id,
                        description: `Updated quote ${updatedQuote.quote?.quote_number || ''}`,
                        ip_address: req.ip,
                        user_agent: req.get('User-Agent') || undefined
                    });
                }
            }
            catch (activityErr) {
                console.warn('Activity logging failed (quote_updated):', activityErr);
            }
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
            const quoteId = parseInt(req.params['id'] || '');
            if (isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid quote ID'
                });
                return;
            }
            let companyIdForLog = undefined;
            try {
                const existing = await this.quoteService.getQuoteById(quoteId);
                companyIdForLog = existing?.quote?.company_id;
            }
            catch { }
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
            try {
                const userId = req.user?.id;
                if (userId) {
                    await this.activityService.logActivity({
                        user_id: userId,
                        company_id: companyIdForLog,
                        action: 'quote_deleted',
                        resource_type: 'quote',
                        resource_id: quoteId,
                        description: `Deleted quote ${quoteId}`,
                        ip_address: req.ip,
                        user_agent: req.get('User-Agent') || undefined
                    });
                }
            }
            catch (activityErr) {
                console.warn('Activity logging failed (quote_deleted):', activityErr);
            }
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
            const companyId = parseInt(req.params['companyId'] || '');
            const query = req.query['query'];
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
            const quoteId = parseInt(req.params['id'] || '');
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
            const quoteId = parseInt(req.params['id'] || '');
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
    async rejectQuote(req, res) {
        try {
            const quoteId = parseInt(req.params.id || '');
            if (!quoteId || isNaN(quoteId)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid quote ID is required'
                });
                return;
            }
            const updated = await this.quoteService.updateQuoteStatus(quoteId, 'rejected');
            if (!updated) {
                res.status(404).json({
                    success: false,
                    error: 'Quote not found'
                });
                return;
            }
            res.json({
                success: true,
                data: { id: quoteId, status: 'rejected' },
                message: 'Quote has been rejected'
            });
        }
        catch (error) {
            console.error('Error in QuoteController.rejectQuote:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reject quote'
            });
        }
    }
}
//# sourceMappingURL=QuoteController.js.map