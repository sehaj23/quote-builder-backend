import { Quote, QuoteLine, QuoteWithLines, CreateQuoteRequest, UpdateQuoteRequest } from '@/types/index.js';
export declare class QuoteRepository {
    private getDbConnection;
    findByCompanyId(companyId: number, limit?: number, offset?: number): Promise<Quote[]>;
    findByCompanyIdPaginated(companyId: number, limit: number, offset: number, filters: {
        search?: string;
        status?: string;
        tier?: string;
    }): Promise<Quote[]>;
    countByCompanyId(companyId: number, filters: {
        search?: string;
        status?: string;
        tier?: string;
    }): Promise<number>;
    findById(id: number): Promise<Quote | null>;
    findByIdWithLines(id: number): Promise<QuoteWithLines | null>;
    getQuoteLines(quoteId: number): Promise<QuoteLine[]>;
    create(quoteData: CreateQuoteRequest): Promise<number>;
    update(id: number, quoteData: UpdateQuoteRequest): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    search(companyId: number, query: string): Promise<Quote[]>;
    duplicate(id: number, newQuoteNumber: string, newTier?: string): Promise<number>;
    findByCompanyAndQuoteNumber(companyId: number, quoteNumber: string): Promise<Quote | null>;
    updateStatus(id: number, status: string): Promise<boolean>;
}
//# sourceMappingURL=QuoteRepository.d.ts.map