/**
 * Centralized Error Exports
 * Import all errors from this file for consistency
 */

// Base error class
export { AppError, ErrorSeverity, ErrorCategory } from './AppError';

// Domain-specific errors
export {
  // Invoice errors
  InvoiceNotFoundError,
  InvoiceAlreadyPaidError,
  InvoiceGenerationError,
  InvoiceCancellationError,
  
  // Payment errors
  PaymentDeclinedError,
  PaymentMethodInvalidError,
  PaymentGatewayError,
  
  // Customer errors
  CustomerNotFoundError,
  DuplicateNIPError,
  InvalidNIPError,
  
  // Product errors
  ProductNotFoundError,
  InsufficientStockError,
  DuplicateProductSKUError,
  
  // Warehouse errors
  WarehouseNotFoundError,
  WarehouseConflictError,
  StockTransferError,
  
  // Expense errors
  ExpenseNotFoundError,
  ExpenseApprovalError,
  
  // Department errors
  DepartmentNotFoundError,
  BudgetExceededError,
  
  // Receipt errors
  ReceiptNotFoundError,
  ReceiptGenerationError,
  
  // Company errors
  CompanyNotFoundError,
  CompanySubscriptionError,
} from './DomainErrors';

// Integration & system errors
export {
  // Integration errors
  AllegroIntegrationError,
  BaseLinkerIntegrationError,
  KSeFIntegrationError,
  EmailDeliveryError,
  SMSDeliveryError,
  WebhookDeliveryError,
  
  // Authentication & Authorization
  UnauthorizedError,
  ForbiddenError,
  InvalidTokenError,
  TokenExpiredError,
  InvalidCredentialsError,
  AccountLockedError,
  
  // Validation errors
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,
  
  // Rate limiting
  RateLimitExceededError,
  
  // Database errors
  DatabaseError,
  DatabaseConnectionError,
  DuplicateRecordError,
  
  // General errors
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
  ExternalServiceError,
} from './IntegrationErrors';
