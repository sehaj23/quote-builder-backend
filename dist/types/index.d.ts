export interface Company {
    id?: number;
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    terms?: string;
    logo_path?: string;
    logo_attachment_id?: number;
    default_tax?: number;
    quote_prefix?: string;
    next_quote_number?: number;
    currency?: string;
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
    discount_type?: 'fixed' | 'percentage';
    total?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface QuoteLine {
    id?: number;
    quote_id: number;
    company_id: number;
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
    default_tax?: number;
    quote_prefix?: string;
    next_quote_number?: number;
    currency?: string;
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
    discount_type?: 'fixed' | 'percentage';
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
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    isApproved?: boolean;
    isSuperUser?: boolean;
    is_super_user?: boolean;
    is_approved?: boolean;
    cognito_id?: string;
    company_id?: number;
    created_at?: Date;
    updated_at?: Date;
    last_activity?: Date;
    createdAt?: string;
    lastActivityAt?: string;
}
export interface CreateUserRequest {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    cognitoId?: string;
    isApproved?: boolean;
    company_id?: number;
}
export interface UpdateUserRequest {
    name?: string;
    firstName?: string;
    lastName?: string;
    is_super_user?: boolean;
    is_approved?: boolean;
    isApproved?: boolean;
    isSuperUser?: boolean;
    company_id?: number;
    last_activity?: Date;
}
export interface Attachment {
    id?: number;
    company_id: number;
    filename: string;
    original_filename: string;
    s3_key: string;
    s3_url: string;
    file_size?: number;
    mime_type?: string;
    type?: string;
    uploaded_by?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreateAttachmentRequest {
    company_id: number;
    filename: string;
    original_filename: string;
    s3_key: string;
    s3_url: string;
    file_size?: number;
    mime_type?: string;
    type?: string;
    uploaded_by?: string;
}
export interface UserActivity {
    id?: number;
    user_id: string;
    company_id?: number;
    action: string;
    resource_type?: string;
    resource_id?: number;
    description?: string;
    ip_address?: string;
    user_agent?: string;
    created_at?: Date;
}
export interface CreateActivityRequest {
    user_id: string;
    company_id?: number | undefined;
    action: string;
    resource_type?: string | undefined;
    resource_id?: number | undefined;
    description?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}
//# sourceMappingURL=index.d.ts.map