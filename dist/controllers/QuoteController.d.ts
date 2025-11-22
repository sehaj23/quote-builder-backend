import { Request, Response } from 'express';
import { QuoteService } from '../services/QuoteService.js';
import { ActivityService } from '../services/ActivityService.js';
export declare class QuoteController {
    private quoteService;
    private activityService;
    constructor(quoteService: QuoteService, activityService?: ActivityService);
    getQuotesByCompany(req: Request, res: Response): Promise<void>;
    getQuoteById(req: Request, res: Response): Promise<void>;
    createQuote(req: Request, res: Response): Promise<void>;
    updateQuote(req: Request, res: Response): Promise<void>;
    deleteQuote(req: Request, res: Response): Promise<void>;
    searchQuotes(req: Request, res: Response): Promise<void>;
    duplicateQuote(req: Request, res: Response): Promise<void>;
    updateQuoteStatus(req: Request, res: Response): Promise<void>;
    rejectQuote(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=QuoteController.d.ts.map