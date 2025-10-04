import { Quote, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '@/types/index.js';
import { QuoteRepository } from '@/repositories/QuoteRepository.js';
export declare class QuoteService {
    private quoteRepository;
    constructor(quoteRepository: QuoteRepository);
    private generateUniqueQuoteNumber;
    getQuotesByCompany(companyId: number, limit?: number, offset?: number): Promise<Quote[]>;
    getQuoteById(id: number): Promise<QuoteWithLines | null>;
    createQuote(quoteData: CreateQuoteRequest): Promise<{
        id: number;
        quote: QuoteWithLines;
    }>;
    updateQuote(id: number, quoteData: UpdateQuoteRequest): Promise<QuoteWithLines | null>;
    deleteQuote(id: number): Promise<boolean>;
    searchQuotes(companyId: number, query: string): Promise<Quote[]>;
    duplicateQuote(id: number, newTier?: string): Promise<{
        id: number;
        quote: QuoteWithLines;
    }>;
    updateQuoteStatus(id: number, status: string): Promise<boolean>;
}
//# sourceMappingURL=QuoteService.d.ts.map