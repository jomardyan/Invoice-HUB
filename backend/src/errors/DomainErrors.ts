import { AppError } from './AppError';

// ============================================
// INVOICE ERRORS
// ============================================

export class InvoiceNotFoundError extends AppError {
  constructor(invoiceId: string, traceId?: string) {
    super(
      'INVOICE_NOT_FOUND',
      404,
      `Invoice with ID ${invoiceId} not found`,
      { invoiceId },
      traceId
    );
  }
}

export class InvoiceAlreadyPaidError extends AppError {
  constructor(invoiceId: string, traceId?: string) {
    super(
      'INVOICE_ALREADY_PAID',
      400,
      `Invoice ${invoiceId} has already been paid`,
      { invoiceId },
      traceId
    );
  }
}

export class InvoiceGenerationError extends AppError {
  constructor(reason: string, details?: Record<string, any>, traceId?: string) {
    super(
      'INVOICE_GENERATION_FAILED',
      500,
      `Failed to generate invoice: ${reason}`,
      details,
      traceId
    );
  }
}

export class InvoiceCancellationError extends AppError {
  constructor(invoiceId: string, reason: string, traceId?: string) {
    super(
      'INVOICE_CANCELLATION_FAILED',
      400,
      `Cannot cancel invoice ${invoiceId}: ${reason}`,
      { invoiceId, reason },
      traceId
    );
  }
}

// ============================================
// PAYMENT ERRORS
// ============================================

export class PaymentDeclinedError extends AppError {
  constructor(paymentId: string, reason?: string, traceId?: string) {
    super(
      'PAYMENT_DECLINED',
      402,
      `Payment ${paymentId} was declined${reason ? `: ${reason}` : ''}`,
      { paymentId, reason },
      traceId
    );
  }
}

export class PaymentMethodInvalidError extends AppError {
  constructor(method: string, traceId?: string) {
    super(
      'PAYMENT_METHOD_INVALID',
      400,
      `Payment method '${method}' is not supported or invalid`,
      { method },
      traceId
    );
  }
}

export class PaymentGatewayError extends AppError {
  constructor(gateway: string, message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'PAYMENT_GATEWAY_ERROR',
      502,
      `Payment gateway ${gateway} error: ${message}`,
      { gateway, ...details },
      traceId
    );
  }
}

// ============================================
// CUSTOMER ERRORS
// ============================================

export class CustomerNotFoundError extends AppError {
  constructor(customerId: string, traceId?: string) {
    super(
      'CUSTOMER_NOT_FOUND',
      404,
      `Customer with ID ${customerId} not found`,
      { customerId },
      traceId
    );
  }
}

export class DuplicateNIPError extends AppError {
  constructor(nip: string, traceId?: string) {
    super(
      'DUPLICATE_NIP',
      409,
      `Customer with NIP ${nip} already exists`,
      { nip },
      traceId
    );
  }
}

export class InvalidNIPError extends AppError {
  constructor(nip: string, traceId?: string) {
    super(
      'INVALID_NIP',
      400,
      `NIP ${nip} is invalid or does not pass validation`,
      { nip },
      traceId
    );
  }
}

// ============================================
// PRODUCT ERRORS
// ============================================

export class ProductNotFoundError extends AppError {
  constructor(productId: string, traceId?: string) {
    super(
      'PRODUCT_NOT_FOUND',
      404,
      `Product with ID ${productId} not found`,
      { productId },
      traceId
    );
  }
}

export class InsufficientStockError extends AppError {
  constructor(productId: string, requested: number, available: number, traceId?: string) {
    super(
      'INSUFFICIENT_STOCK',
      400,
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      { productId, requested, available },
      traceId
    );
  }
}

export class DuplicateProductSKUError extends AppError {
  constructor(sku: string, traceId?: string) {
    super(
      'DUPLICATE_PRODUCT_SKU',
      409,
      `Product with SKU ${sku} already exists`,
      { sku },
      traceId
    );
  }
}

// ============================================
// WAREHOUSE ERRORS
// ============================================

export class WarehouseNotFoundError extends AppError {
  constructor(warehouseId: string, traceId?: string) {
    super(
      'WAREHOUSE_NOT_FOUND',
      404,
      `Warehouse with ID ${warehouseId} not found`,
      { warehouseId },
      traceId
    );
  }
}

export class WarehouseConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'WAREHOUSE_CONFLICT',
      409,
      message,
      details,
      traceId
    );
  }
}

export class StockTransferError extends AppError {
  constructor(fromWarehouse: string, toWarehouse: string, reason: string, traceId?: string) {
    super(
      'STOCK_TRANSFER_FAILED',
      400,
      `Stock transfer from ${fromWarehouse} to ${toWarehouse} failed: ${reason}`,
      { fromWarehouse, toWarehouse, reason },
      traceId
    );
  }
}

// ============================================
// EXPENSE ERRORS
// ============================================

export class ExpenseNotFoundError extends AppError {
  constructor(expenseId: string, traceId?: string) {
    super(
      'EXPENSE_NOT_FOUND',
      404,
      `Expense with ID ${expenseId} not found`,
      { expenseId },
      traceId
    );
  }
}

export class ExpenseApprovalError extends AppError {
  constructor(expenseId: string, reason: string, traceId?: string) {
    super(
      'EXPENSE_APPROVAL_FAILED',
      400,
      `Cannot approve expense ${expenseId}: ${reason}`,
      { expenseId, reason },
      traceId
    );
  }
}

// ============================================
// DEPARTMENT ERRORS
// ============================================

export class DepartmentNotFoundError extends AppError {
  constructor(departmentId: string, traceId?: string) {
    super(
      'DEPARTMENT_NOT_FOUND',
      404,
      `Department with ID ${departmentId} not found`,
      { departmentId },
      traceId
    );
  }
}

export class BudgetExceededError extends AppError {
  constructor(departmentId: string, budget: number, amount: number, traceId?: string) {
    super(
      'BUDGET_EXCEEDED',
      400,
      `Department ${departmentId} budget exceeded. Budget: ${budget}, Attempted: ${amount}`,
      { departmentId, budget, amount, exceeded: amount - budget },
      traceId
    );
  }
}

// ============================================
// RECEIPT ERRORS
// ============================================

export class ReceiptNotFoundError extends AppError {
  constructor(receiptId: string, traceId?: string) {
    super(
      'RECEIPT_NOT_FOUND',
      404,
      `Receipt with ID ${receiptId} not found`,
      { receiptId },
      traceId
    );
  }
}

export class ReceiptGenerationError extends AppError {
  constructor(reason: string, details?: Record<string, any>, traceId?: string) {
    super(
      'RECEIPT_GENERATION_FAILED',
      500,
      `Failed to generate receipt: ${reason}`,
      details,
      traceId
    );
  }
}

// ============================================
// COMPANY ERRORS
// ============================================

export class CompanyNotFoundError extends AppError {
  constructor(companyId: string, traceId?: string) {
    super(
      'COMPANY_NOT_FOUND',
      404,
      `Company with ID ${companyId} not found`,
      { companyId },
      traceId
    );
  }
}

export class CompanySubscriptionError extends AppError {
  constructor(companyId: string, reason: string, traceId?: string) {
    super(
      'COMPANY_SUBSCRIPTION_ERROR',
      402,
      `Company ${companyId} subscription issue: ${reason}`,
      { companyId, reason },
      traceId
    );
  }
}
