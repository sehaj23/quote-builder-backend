import { Router } from 'express';
import { QuoteController } from '@/controllers/QuoteController.js';

const router = Router({ mergeParams: true });
const quoteController = new QuoteController();

// Quote routes
// Note: These routes are mounted under /api/companies/:companyId/quotes and /api/quotes

// Company-specific quote routes (mounted under /api/companies/:companyId/quotes)
router.get('/search', quoteController.searchQuotes.bind(quoteController));  // GET /api/companies/:companyId/quotes/search?query=...
router.get('/', quoteController.getQuotesByCompany.bind(quoteController));  // GET /api/companies/:companyId/quotes

// Individual quote routes (mounted under /api/quotes)
export const individualQuoteRouter = Router();
individualQuoteRouter.get('/:id', quoteController.getQuoteById.bind(quoteController));  // GET /api/quotes/:id
individualQuoteRouter.post('/', quoteController.createQuote.bind(quoteController));  // POST /api/quotes
individualQuoteRouter.put('/:id', quoteController.updateQuote.bind(quoteController));  // PUT /api/quotes/:id
individualQuoteRouter.delete('/:id', quoteController.deleteQuote.bind(quoteController));  // DELETE /api/quotes/:id
individualQuoteRouter.post('/:id/duplicate', quoteController.duplicateQuote.bind(quoteController));  // POST /api/quotes/:id/duplicate
individualQuoteRouter.patch('/:id/status', quoteController.updateQuoteStatus.bind(quoteController));  // PATCH /api/quotes/:id/status

export default router;