# Error Handling Implementation Guide

Guide for developers on how to use the enhanced error handling system in Invoice-HUB.

## Quick Start

### Import Errors

```typescript
import {
  InvoiceNotFoundError,
  ValidationError,
  PaymentDeclinedError,
  UnauthorizedError,
} from '@/errors';
```

### Throw Errors in Controllers/Services

```typescript
// In a service method
const invoice = await this.invoiceRepository.findOne({ where: { id } });
if (!invoice) {
  throw new InvoiceNotFoundError(id, req.headers['x-request-id']);
}
```

### Errors are Automatically Handled

The error middleware will:
- Generate trace IDs
- Log appropriately
- Send Sentry notifications (for critical errors)
- Return standardized JSON response

## Controller Pattern

### Example: Invoice Controller

```typescript
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  InvoiceNotFoundError,
  InvoiceAlreadyPaidError,
  ValidationError,
} from '@/errors';
import { InvoiceService } from '@/services/InvoiceService';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * Get invoice by ID
   * Automatically handles async errors with asyncHandler
   */
  getInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const traceId = req.headers['x-request-id'] as string;

    // Service throws InvoiceNotFoundError if not found
    const invoice = await this.invoiceService.getById(id, traceId);

    res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Update invoice
   * Demonstrates validation and business logic errors
   */
  updateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const traceId = req.headers['x-request-id'] as string;

    const invoice = await this.invoiceService.getById(id, traceId);

    // Business logic validation
    if (invoice.status === 'paid') {
      throw new InvoiceAlreadyPaidError(id, traceId);
    }

    const updatedInvoice = await this.invoiceService.update(
      id,
      req.body,
      traceId
    );

    res.json({
      success: true,
      data: updatedInvoice,
    });
  });
}
```

## Service Layer Pattern

### Example: Invoice Service

```typescript
import { Repository } from 'typeorm';
import { Invoice } from '@/entities/Invoice';
import {
  InvoiceNotFoundError,
  InvoiceGenerationError,
  DatabaseError,
} from '@/errors';
import logger from '@/utils/logger';

export class InvoiceService {
  private invoiceRepository: Repository<Invoice>;

  /**
   * Get invoice by ID
   * Throws InvoiceNotFoundError if not found
   */
  async getById(id: string, traceId?: string): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id },
        relations: ['items', 'customer', 'company'],
      });

      if (!invoice) {
        throw new InvoiceNotFoundError(id, traceId);
      }

      return invoice;
    } catch (error) {
      // If it's our custom error, re-throw it
      if (error instanceof InvoiceNotFoundError) {
        throw error;
      }

      // Wrap database errors
      logger.error('Database error in getById', { error, invoiceId: id });
      throw new DatabaseError('fetch invoice', { invoiceId: id }, traceId);
    }
  }

  /**
   * Generate invoice PDF
   * Wraps external service errors
   */
  async generatePDF(id: string, traceId?: string): Promise<Buffer> {
    const invoice = await this.getById(id, traceId);

    try {
      const pdf = await this.pdfService.generate(invoice);
      return pdf;
    } catch (error) {
      logger.error('PDF generation failed', {
        error,
        invoiceId: id,
        traceId,
      });

      throw new InvoiceGenerationError(
        'PDF rendering failed',
        {
          invoiceId: id,
          originalError: error.message,
        },
        traceId
      );
    }
  }
}
```

## Validation Pattern with Zod

```typescript
import { z } from 'zod';
import { ValidationError } from '@/errors';

// Define schema
const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    })
  ).min(1),
  dueDate: z.string().datetime(),
});

// In controller
createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const traceId = req.headers['x-request-id'] as string;

  // Validate with Zod
  const validation = createInvoiceSchema.safeParse(req.body);
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error, traceId);
  }

  const invoice = await this.invoiceService.create(validation.data, traceId);

  res.status(201).json({
    success: true,
    data: invoice,
  });
});
```

## Integration Error Wrapping

### Example: Allegro Integration

```typescript
import { AllegroIntegrationError } from '@/errors';
import axios, { AxiosError } from 'axios';

export class AllegroService {
  async getOrders(token: string, traceId?: string) {
    try {
      const response = await axios.get(
        'https://api.allegro.pl/sale/orders',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        throw new AllegroIntegrationError(
          'Failed to fetch orders',
          {
            statusCode: axiosError.response?.status,
            message: axiosError.response?.data?.message,
            endpoint: 'GET /sale/orders',
          },
          traceId
        );
      }

      // Unknown error
      throw new AllegroIntegrationError(
        'Unknown error fetching orders',
        { originalError: error.message },
        traceId
      );
    }
  }
}
```

## Authentication Middleware Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, InvalidTokenError } from '@/errors';
import { verifyToken } from '@/utils/jwt';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const traceId = req.headers['x-request-id'] as string;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No authentication token provided', traceId);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new InvalidTokenError('Token has expired', traceId);
    }
    throw new InvalidTokenError('Invalid token', traceId);
  }
};
```

## Testing Error Scenarios

```typescript
import { InvoiceNotFoundError } from '@/errors';
import { InvoiceService } from '@/services/InvoiceService';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    service = new InvoiceService();
  });

  describe('getById', () => {
    it('should throw InvoiceNotFoundError when invoice does not exist', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.getById(nonExistentId)).rejects.toThrow(
        InvoiceNotFoundError
      );
    });

    it('should include trace ID in error', async () => {
      const nonExistentId = 'non-existent-id';
      const traceId = 'test-trace-123';

      try {
        await service.getById(nonExistentId, traceId);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(InvoiceNotFoundError);
        expect(error.traceId).toBe(traceId);
        expect(error.code).toBe('INVOICE_NOT_FOUND');
        expect(error.statusCode).toBe(404);
      }
    });
  });
});
```

## Migration from Old Error Handling

### Old Way ❌

```typescript
// Old error handling
if (!invoice) {
  return res.status(404).json({
    status: 'error',
    message: 'Invoice not found',
  });
}

// Or throwing generic errors
throw new Error('Invoice not found');
```

### New Way ✅

```typescript
import { InvoiceNotFoundError } from '@/errors';

if (!invoice) {
  throw new InvoiceNotFoundError(id, traceId);
}

// The error middleware handles the rest
```

## Best Practices

### 1. Always Pass Trace ID

```typescript
const traceId = req.headers['x-request-id'] as string;
throw new InvoiceNotFoundError(id, traceId);
```

### 2. Include Relevant Context in Details

```typescript
throw new PaymentDeclinedError(
  paymentId,
  'Insufficient funds',
  traceId
);

// Details automatically include paymentId and reason
```

### 3. Don't Catch and Swallow Errors

```typescript
// ❌ Bad
try {
  await service.doSomething();
} catch (error) {
  console.log('Error occurred');
  // Error is lost!
}

// ✅ Good
try {
  await service.doSomething();
} catch (error) {
  // Re-throw or wrap in custom error
  throw new ServiceError('Operation failed', { originalError: error.message }, traceId);
}
```

### 4. Use asyncHandler for All Async Routes

```typescript
import { asyncHandler } from '@/middleware/errorHandler';

// ✅ Automatically catches async errors
router.get('/invoices/:id', asyncHandler(controller.getInvoice));

// ❌ Manual try-catch needed
router.get('/invoices/:id', async (req, res, next) => {
  try {
    await controller.getInvoice(req, res);
  } catch (error) {
    next(error);
  }
});
```

### 5. Create Custom Errors for New Domains

```typescript
// Add to DomainErrors.ts
export class TemplateNotFoundError extends AppError {
  constructor(templateId: string, traceId?: string) {
    super(
      'TEMPLATE_NOT_FOUND',
      404,
      `Template with ID ${templateId} not found`,
      { templateId },
      traceId
    );
  }
}

// Export from errors/index.ts
export { TemplateNotFoundError } from './DomainErrors';
```

## Common Patterns

### Pattern 1: Resource Not Found

```typescript
const resource = await repository.findOne({ where: { id } });
if (!resource) {
  throw new ResourceNotFoundError(id, traceId);
}
```

### Pattern 2: Authorization Check

```typescript
if (req.user.role !== 'admin') {
  throw new ForbiddenError('invoices', 'delete', traceId);
}
```

### Pattern 3: Business Rule Validation

```typescript
if (invoice.status === 'paid') {
  throw new InvoiceAlreadyPaidError(invoice.id, traceId);
}

if (product.stock < requestedQuantity) {
  throw new InsufficientStockError(
    product.id,
    requestedQuantity,
    product.stock,
    traceId
  );
}
```

### Pattern 4: External Service Integration

```typescript
try {
  const result = await externalApi.call();
  return result;
} catch (error) {
  throw new ExternalServiceError(
    'ServiceName',
    error.message,
    { endpoint: '/api/endpoint', statusCode: error.statusCode },
    traceId
  );
}
```

## Error Response Examples

See [ERROR_CODES.md](./ERROR_CODES.md) for complete API client documentation.

---

**Last Updated**: November 19, 2025  
**For Questions**: Contact the backend team
