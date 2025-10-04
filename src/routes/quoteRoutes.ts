import { Router } from 'express';
import { QuoteController } from '@/controllers/QuoteController';
import { QuoteService } from '@/services/QuoteService';
import { QuoteRepository } from '@/repositories/QuoteRepository';
import { authenticateToken } from '@/middleware/auth.js';

const router = Router({ mergeParams: true });

// Dependency injection
const quoteRepository = new QuoteRepository();
const quoteService = new QuoteService(quoteRepository);
const quoteController = new QuoteController(quoteService);

// Quote routes
// Note: These routes are mounted under /api/companies/:companyId/quotes and /api/quotes

// Company-specific quote routes (mounted under /api/companies/:companyId/quotes)
router.get('/search', authenticateToken, quoteController.searchQuotes.bind(quoteController));  // GET /api/companies/:companyId/quotes/search?query=...
router.get('/', authenticateToken, quoteController.getQuotesByCompany.bind(quoteController));  // GET /api/companies/:companyId/quotes

// Individual quote routes (mounted under /api/quotes)
export const individualQuoteRouter = Router();
individualQuoteRouter.get('/:id', authenticateToken, quoteController.getQuoteById.bind(quoteController));  // GET /api/quotes/:id
individualQuoteRouter.post('/', authenticateToken, quoteController.createQuote.bind(quoteController));  // POST /api/quotes
individualQuoteRouter.put('/:id', authenticateToken, quoteController.updateQuote.bind(quoteController));  // PUT /api/quotes/:id
individualQuoteRouter.delete('/:id', authenticateToken, quoteController.deleteQuote.bind(quoteController));  // DELETE /api/quotes/:id
individualQuoteRouter.post('/:id/duplicate', authenticateToken, quoteController.duplicateQuote.bind(quoteController));  // POST /api/quotes/:id/duplicate
individualQuoteRouter.put('/:id/reject', authenticateToken, quoteController.rejectQuote.bind(quoteController));  // PUT /api/quotes/:id/reject
individualQuoteRouter.patch('/:id/status', authenticateToken, quoteController.updateQuoteStatus.bind(quoteController));  // PATCH /api/quotes/:id/status

export default router;