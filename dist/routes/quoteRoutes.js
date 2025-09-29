import { Router } from 'express';
import { QuoteController } from '@/controllers/QuoteController.js';
const router = Router();
const quoteController = new QuoteController();
router.get('/search', quoteController.searchQuotes);
router.get('/', quoteController.getQuotesByCompany);
export const individualQuoteRouter = Router();
individualQuoteRouter.get('/:id', quoteController.getQuoteById);
individualQuoteRouter.post('/', quoteController.createQuote);
individualQuoteRouter.put('/:id', quoteController.updateQuote);
individualQuoteRouter.delete('/:id', quoteController.deleteQuote);
individualQuoteRouter.post('/:id/duplicate', quoteController.duplicateQuote);
individualQuoteRouter.patch('/:id/status', quoteController.updateQuoteStatus);
export default router;
//# sourceMappingURL=quoteRoutes.js.map