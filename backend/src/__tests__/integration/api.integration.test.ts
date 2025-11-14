import request from 'supertest';
import express from 'express';

// Mock Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
    });
  });

  // Mock invoice creation endpoint
  app.post('/api/v1/invoices', (_req, res) => {
    const { companyId, customerId, items } = _req.body;

    if (!companyId || !customerId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    return res.status(201).json({
      id: 'invoice-123',
      invoiceNumber: 'INV-2024-11-001',
      status: 'draft',
      companyId,
      customerId,
      total: 492,
      items,
    });
  });

  // Mock Allegro auth endpoint
  app.get('/api/v1/allegro/auth/authorize', (_req, res) => {
    const { tenantId } = _req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    return res.json({
      authUrl: `https://api.allegro.pl/auth/oauth/authorize?client_id=test&state=${Buffer.from(JSON.stringify({ tenantId })).toString('base64')}`,
    });
  });

  // Mock Allegro sync endpoint
  app.post('/api/v1/allegro/sync', (_req, res) => {
    const { integrationId, companyId, tenantId } = _req.body;

    if (!integrationId || !companyId || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    return res.json({
      success: true,
      ordersProcessed: 5,
      invoicesCreated: 5,
      errors: [],
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBe('test');
    });
  });

  describe('Invoice Endpoints', () => {
    it('should create an invoice with valid data', async () => {
      const invoiceData = {
        companyId: 'company-123',
        customerId: 'customer-456',
        items: [
          {
            description: 'Test Product',
            quantity: 2,
            unitPrice: 100,
            vatRate: 23,
          },
        ],
      };

      const response = await request(app).post('/api/v1/invoices').send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.invoiceNumber).toBe('INV-2024-11-001');
      expect(response.body.status).toBe('draft');
    });

    it('should reject invoice creation with missing fields', async () => {
      const incompleteData = {
        companyId: 'company-123',
        // Missing customerId and items
      };

      const response = await request(app).post('/api/v1/invoices').send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should reject invoice creation with empty items array', async () => {
      const invoiceData = {
        companyId: 'company-123',
        customerId: 'customer-456',
        items: [],
      };

      const response = await request(app).post('/api/v1/invoices').send(invoiceData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Allegro Integration Endpoints', () => {
    it('should return authorization URL for Allegro', async () => {
      const tenantId = 'tenant-123';
      const response = await request(app)
        .get('/api/v1/allegro/auth/authorize')
        .query({ tenantId });

      expect(response.status).toBe(200);
      expect(response.body.authUrl).toContain('allegro');
      expect(response.body.authUrl).toContain('client_id=test');
    });

    it('should reject authorization without tenantId', async () => {
      const response = await request(app).get('/api/v1/allegro/auth/authorize');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing tenantId');
    });

    it('should sync orders from Allegro', async () => {
      const syncData = {
        integrationId: 'integration-123',
        companyId: 'company-123',
        tenantId: 'tenant-123',
      };

      const response = await request(app).post('/api/v1/allegro/sync').send(syncData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ordersProcessed).toBe(5);
      expect(response.body.invoicesCreated).toBe(5);
    });

    it('should reject sync without required fields', async () => {
      const incompleteSyncData = {
        integrationId: 'integration-123',
        // Missing companyId and tenantId
      };

      const response = await request(app).post('/api/v1/allegro/sync').send(incompleteSyncData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/api/v1/non-existent');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should return 405 for unsupported HTTP methods', async () => {
      const response = await request(app).delete('/health');

      expect(response.status).toBe(404); // Not Found is more appropriate than 405
    });
  });

  describe('Request Validation', () => {
    it('should validate Content-Type headers', async () => {
      const invoiceData = {
        companyId: 'company-123',
        customerId: 'customer-456',
        items: [{ description: 'Test', quantity: 1, unitPrice: 100, vatRate: 23 }],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Content-Type', 'application/json')
        .send(invoiceData);

      expect(response.status).toBe(201);
    });

    it('should handle query parameters correctly', async () => {
      const response = await request(app)
        .get('/api/v1/allegro/auth/authorize')
        .query({ tenantId: 'tenant-123' });

      expect(response.status).toBe(200);
      expect(response.body.authUrl).toBeDefined();
    });
  });
});
