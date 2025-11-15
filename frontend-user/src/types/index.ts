// User Types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  USER = 'user',
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'trial' | 'suspended' | 'cancelled';
  monthlyInvoiceLimit: number;
  currentMonthInvoices: number;
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  STANDARD = 'standard',
  PROFORMA = 'proforma',
  CORRECTIVE = 'corrective',
  ADVANCE = 'advance',
  FINAL = 'final',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
  OTHER = 'other',
}

export enum Currency {
  PLN = 'PLN',
  EUR = 'EUR',
  USD = 'USD',
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  currency: Currency;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  totalVat: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  terms?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  customer?: Customer;
}

// Company Types
export interface Company {
  id: string;
  tenantId: string;
  name: string;
  nip: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  bankAccount?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export enum CustomerType {
  COMPANY = 'company',
  INDIVIDUAL = 'individual',
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  nip?: string;
  customerType: CustomerType;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
  isActive: boolean;
  totalInvoices?: number;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  vatRate: number;
  unit: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
}

// Notification Types
export enum NotificationType {
  INVOICE_PAID = 'invoice_paid',
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_OVERDUE = 'invoice_overdue',
  ALLEGRO_ORDER_SYNCED = 'allegro_order_synced',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedResourceId?: string;
  relatedResourceType?: string;
  createdAt: string;
}

// Template Types
export enum TemplateType {
  EMAIL = 'email',
  INVOICE = 'invoice',
}

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  type: TemplateType;
  subject?: string;
  content: string;
  variables?: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Webhook Types
export enum WebhookEvent {
  INVOICE_CREATED = 'invoice.created',
  INVOICE_UPDATED = 'invoice.updated',
  INVOICE_PAID = 'invoice.paid',
  PAYMENT_RECEIVED = 'payment.received',
}

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Webhook {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: WebhookStatus;
  createdAt: string;
  updatedAt: string;
}

// Report Types
export interface SalesReport {
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  revenueByCustomer: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
  }>;
  revenueByProduct: Array<{
    productId: string;
    productName: string;
    revenue: number;
  }>;
}

export interface TaxReport {
  period: {
    start: string;
    end: string;
  };
  vatSummary: Array<{
    rate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }>;
  totalVatCollected: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tenant: Tenant;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

// API Response Types
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}
