import { Request, Response } from 'express';
export declare class QuoteController {
    private quoteService;
    constructor();
    getQuotesByCompany(req: Request, res: Response): Promise<void>;
    getQuoteById(req: Request, res: Response): Promise<void>;
    createQuote(req: Request, res: Response): Promise<void>;
    updateQuote(req: Request, res: Response): Promise<void>;
    deleteQuote(req: Request, res: Response): Promise<void>;
    searchQuotes(req: Request, res: Response): Promise<void>;
    duplicateQuote(req: Request, res: Response): Promise<void>;
    updateQuoteStatus(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=QuoteController.d.ts.map