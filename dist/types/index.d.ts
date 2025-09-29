export interface Company {
    id?: number;
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    terms?: string;
    logo_path?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface Item {
    id?: number;
    company_id: number;
    name: string;
    default_description?: string;
    unit: string;
    default_area?: number;
    unit_cost: number;
    economy_unit_cost?: number;
    luxury_unit_cost?: number;
    tags?: string;
    category?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface Quote {
    id?: number;
    company_id: number;
    quote_number: string;
    project_name?: string;
    customer_name?: string;
    customer_email?: string;
    customer_mobile?: string;
    tier?: 'economy' | 'standard' | 'luxury';
    status?: 'draft' | 'sent' | 'approved' | 'rejected';
    subtotal?: number;
    tax?: number;
    discount?: number;
    total?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface QuoteLine {
    id?: number;
    quote_id: number;
    item_id: number;
    description?: string;
    unit?: string;
    quantity?: number;
    area?: number;
    unit_rate?: number;
    line_total?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface QuoteWithLines {
    quote: Quote;
    lines: QuoteLine[];
}
export interface CreateCompanyRequest {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    terms?: string;
    logo_path?: string;
}
export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
}
export interface CreateItemRequest {
    company_id: number;
    name: string;
    default_description?: string;
    unit: string;
    default_area?: number;
    unit_cost: number;
    economy_unit_cost?: number;
    luxury_unit_cost?: number;
    tags?: string;
    category?: string;
}
export interface UpdateItemRequest extends Partial<CreateItemRequest> {
}
export interface CreateQuoteRequest {
    company_id: number;
    quote_number: string;
    project_name?: string;
    customer_name?: string;
    customer_email?: string;
    customer_mobile?: string;
    tier?: 'economy' | 'standard' | 'luxury';
    status?: 'draft' | 'sent' | 'approved' | 'rejected';
    subtotal?: number;
    tax?: number;
    discount?: number;
    total?: number;
    lines: Omit<QuoteLine, 'id' | 'quote_id' | 'created_at' | 'updated_at'>[];
}
export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
}
export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    charset?: string;
    timezone?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationOptions {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}
export interface SearchQuotesOptions extends PaginationOptions {
    query?: string;
    status?: Quote['status'];
    tier?: Quote['tier'];
    customer?: string;
    dateFrom?: string;
    dateTo?: string;
}
export interface SearchItemsOptions extends PaginationOptions {
    query?: string;
    category?: string;
    minCost?: number;
    maxCost?: number;
}
//# sourceMappingURL=index.d.ts.map