// Shared domain enums/types
export type Tier = 'economy' | 'standard' | 'luxury';

// Database entity types
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
  luxury_description?: string;
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
  tier?: Tier;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
  subtotal?: number;
  tax?: number;
  discount?: number;
  discount_type?: 'fixed' | 'percentage';
  design_fee?: number;
  design_fee_type?: 'fixed' | 'percentage';
  handling_fee?: number;
  handling_fee_type?: 'fixed' | 'percentage';
  total?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface QuoteLine {
  id?: number;
  quote_id: number;
  company_id: number;
  item_id?: number | null;
  item_name?: string;
  item_unit?: string;
  item_category?: string;
  description?: string;
  section_key?: string;
  section_index?: number;
  section_label?: string;
  sort_order?: number;
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
  tasks?: Task[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskReminderFrequency = 'once' | 'daily' | 'weekly' | 'before_due';
export type TaskReminderStatus = 'pending' | 'sent' | 'failed' | 'snoozed';

export interface Task {
  id?: number;
  quote_id: number;
  company_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at?: Date | string;
  assigned_to?: string;
  assigned_phone?: string;
  reminder_enabled?: boolean;
  reminder_channel?: 'whatsapp' | 'email' | 'none';
  reminder_frequency?: TaskReminderFrequency;
  next_reminder_at?: Date | string | null;
  reminder_status?: TaskReminderStatus;
  reminder_error?: string | null;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateTaskRequest extends Omit<Task, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {}

export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  overdueOnly?: boolean;
}

export interface TaskProgressSummary {
  total: number;
  completed: number;
  overdue: number;
  in_progress: number;
  pending: number;
  percent_complete: number;
}

export interface TaskReminderLog {
  id?: number;
  task_id: number;
  channel: 'whatsapp' | 'email';
  status: TaskReminderStatus;
  message_body?: string;
  provider_message_id?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  direction?: 'outbound' | 'inbound';
  reply_from?: string | null;
  sent_at?: Date | string | null;
  created_at?: Date;
}

export interface CreateTaskReminderLogRequest extends Omit<TaskReminderLog, 'id' | 'created_at'> {}

// API Request/Response types
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

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {}

export interface CreateItemRequest {
  company_id: number;
  name: string;
  default_description?: string;
  luxury_description?: string;
  unit: string;
  default_area?: number;
  unit_cost: number;
  economy_unit_cost?: number;
  luxury_unit_cost?: number;
  tags?: string;
  category?: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {}

export interface CreateQuoteRequest {
  company_id: number;
  quote_number: string;
  project_name?: string;
  customer_name?: string;
  customer_email?: string;
  customer_mobile?: string;
  tier?: Tier;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
  subtotal?: number;
  tax?: number;
  discount?: number;
  discount_type?: 'fixed' | 'percentage';
  design_fee?: number;
  design_fee_type?: 'fixed' | 'percentage';
  handling_fee?: number;
  handling_fee_type?: 'fixed' | 'percentage';
  total?: number;
  lines: Omit<QuoteLine, 'id' | 'quote_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {}

// Database configuration
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  charset?: string;
  timezone?: string;
}

// API Response types
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

// Search and filter types
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

// User and authentication types
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

// Attachment types
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

// User activity types
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