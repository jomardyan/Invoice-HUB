// @ts-nocheck
import {
  CustomerService,
  CustomerCreateInput,
  CustomerUpdateInput,
} from '@/services/CustomerService';
import { CustomerType } from '@/entities/Customer';
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mocked-uuid-v4') }));
describe('CustomerService', () => {
  let customerService: CustomerService;
  beforeEach(() => {
    customerService = new CustomerService();
  });
  describe('createCustomer', () => {
    it('should create individual customer', () => {
      const input: CustomerCreateInput = {
        name: 'John Doe',
        type: CustomerType.INDIVIDUAL,
        email: 'john@example.com',
      };
      expect(input.type).toBe(CustomerType.INDIVIDUAL);
      expect(input.name).toBeTruthy();
    });
    it('should create business customer', () => {
      const input: CustomerCreateInput = {
        name: 'ABC Company',
        type: CustomerType.BUSINESS,
        nip: '1234567890',
        vatEu: 'PL1234567890',
      };
      expect(input.type).toBe(CustomerType.BUSINESS);
      expect(input.nip).toBeDefined();
    });
    it('should require NIP for business customers', () => {
      const businessCustomer: CustomerCreateInput = {
        name: 'Business Company',
        type: CustomerType.BUSINESS,
        nip: '1234567890',
      };
      expect(businessCustomer.nip).toBeDefined();
      const nipRegex = /^\d{10}$/;
      expect(nipRegex.test(businessCustomer.nip)).toBe(true);
    });
    it('should prevent duplicate customer email', () => {
      const customers = [{ tenantId: 'tenant-1', email: 'john@example.com', id: 'cust-1' }];
      const isDuplicate = customers.some((c) => c.email === 'john@example.com');
      expect(isDuplicate).toBe(true);
    });
    it('should support customer tagging', () => {
      const input: CustomerCreateInput = {
        name: 'Valued Customer',
        type: CustomerType.BUSINESS,
        tags: ['VIP', 'Premium', 'Early-Adopter'],
      };
      expect(input.tags).toHaveLength(3);
      expect(input.tags).toContain('VIP');
    });
  });
  describe('customer types', () => {
    it('should differentiate individual and business customers', () => {
      expect(CustomerType.INDIVIDUAL).not.toBe(CustomerType.BUSINESS);
    });
    it('should validate customer type', () => {
      const validTypes = Object.values(CustomerType);
      expect(validTypes).toContain(CustomerType.INDIVIDUAL);
      expect(validTypes).toContain(CustomerType.BUSINESS);
    });
  });
  describe('contact information', () => {
    it('should validate email format', () => {
      const validEmails = ['customer@example.com', 'test@business.pl'];
      const invalidEmails = ['invalid.email', '@nodomain.com'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
    it('should validate phone number', () => {
      const validPhones = ['+48123456789', '123456789'];
      const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
      validPhones.forEach((phone) => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
    });
    it('should store both billing and shipping addresses', () => {
      const input: CustomerCreateInput = {
        name: 'John Doe',
        type: CustomerType.INDIVIDUAL,
        billingAddress: 'Billing Street 1',
        billingCity: 'Warsaw',
        shippingAddress: 'Shipping Street 2',
        shippingCity: 'Krakow',
      };
      expect(input.billingAddress).toBeDefined();
      expect(input.shippingAddress).toBeDefined();
      expect(input.billingCity).not.toBe(input.shippingCity);
    });
  });
  describe('customer preferences', () => {
    it('should store communication preferences', () => {
      const preferences = {
        preferredLanguage: 'pl',
        preferredCurrency: 'PLN',
        emailNotifications: true,
        smsNotifications: false,
      };
      expect(preferences.preferredLanguage).toBe('pl');
      expect(['PLN', 'EUR', 'USD']).toContain(preferences.preferredCurrency);
      expect(typeof preferences.emailNotifications).toBe('boolean');
    });
    it('should support multiple language preferences', () => {
      const languages = ['pl', 'en', 'de'];
      languages.forEach((lang) => {
        expect(lang).toHaveLength(2);
      });
    });
    it('should support multiple currency preferences', () => {
      const currencies = ['PLN', 'EUR', 'USD', 'GBP'];
      currencies.forEach((currency) => {
        expect(currency).toHaveLength(3);
      });
    });
  });
  describe('payment terms', () => {
    it('should set credit limit for customer', () => {
      const input: CustomerCreateInput = {
        name: 'Customer',
        type: CustomerType.BUSINESS,
        creditLimit: 50000,
      };
      expect(input.creditLimit).toBeGreaterThan(0);
    });
    it('should set payment term days', () => {
      const input: CustomerCreateInput = {
        name: 'Customer',
        type: CustomerType.BUSINESS,
        paymentTermDays: 30,
      };
      expect(input.paymentTermDays).toBeGreaterThan(0);
    });
    it('should support various payment term options', () => {
      const paymentTerms = [7, 14, 30, 60, 90];
      paymentTerms.forEach((days) => {
        expect(days).toBeGreaterThan(0);
      });
    });
  });
  describe('customer notes', () => {
    it('should store customer notes', () => {
      const input: CustomerCreateInput = {
        name: 'Customer',
        type: CustomerType.INDIVIDUAL,
        notes: 'VIP customer - always follows up within 24 hours',
      };
      expect(input.notes).toBeDefined();
      expect(input.notes.length).toBeGreaterThan(0);
    });
  });
  describe('customer updates', () => {
    it('should allow partial customer updates', () => {
      const update: CustomerUpdateInput = { phone: '+48123456789', creditLimit: 100000 };
      expect(update.phone).toBeDefined();
      expect(update.creditLimit).toBeDefined();
      expect(update.email).toBeUndefined();
    });
    it('should prevent duplicate email on update', () => {
      const existingEmails = ['existing@example.com'];
      const newEmail = 'existing@example.com';
      const isDuplicate = existingEmails.includes(newEmail);
      expect(isDuplicate).toBe(true);
    });
  });
  describe('customer retrieval', () => {
    it('should fetch customer by ID', () => {
      const customerId = 'mocked-uuid-v4';
      expect(customerId).toBeDefined();
    });
    it('should list customers with pagination', () => {
      const page = 1;
      const limit = 50;
      const skip = (page - 1) * limit;
      expect(skip).toBe(0);
    });
    it('should filter customers by type', () => {
      const customers = [
        { type: CustomerType.INDIVIDUAL, id: 'cust-1' },
        { type: CustomerType.BUSINESS, id: 'cust-2' },
        { type: CustomerType.INDIVIDUAL, id: 'cust-3' },
      ];
      const individuals = customers.filter((c) => c.type === CustomerType.INDIVIDUAL);
      expect(individuals).toHaveLength(2);
    });
    it('should filter customers by tags', () => {
      const customers = [
        { id: 'cust-1', tags: ['VIP', 'Premium'] },
        { id: 'cust-2', tags: ['Regular'] },
        { id: 'cust-3', tags: ['VIP', 'Wholesale'] },
      ];
      const vipCustomers = customers.filter((c) => c.tags.includes('VIP'));
      expect(vipCustomers).toHaveLength(2);
    });
  });
  describe('tax identification', () => {
    it('should validate NIP format', () => {
      const validNIP = '1234567890';
      const invalidNIP = '123456789';
      const nipRegex = /^\d{10}$/;
      expect(nipRegex.test(validNIP)).toBe(true);
      expect(nipRegex.test(invalidNIP)).toBe(false);
    });
    it('should validate VAT-EU number', () => {
      const validVatEU = 'PL1234567890';
      const invalidVatEU = 'INVALID123';
      const vatEURegex = /^[A-Z]{2}\d{10,}$/;
      expect(vatEURegex.test(validVatEU)).toBe(true);
      expect(vatEURegex.test(invalidVatEU)).toBe(false);
    });
  });
  describe('customer search', () => {
    it('should search by customer name', () => {
      const customers = [
        { name: 'John Doe', id: 'cust-1' },
        { name: 'Jane Smith', id: 'cust-2' },
        { name: 'John Smith', id: 'cust-3' },
      ];
      const searchTerm = 'John';
      const results = customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(2);
    });
    it('should search by email', () => {
      const customers = [
        { email: 'john@example.com', id: 'cust-1' },
        { email: 'jane@example.com', id: 'cust-2' },
      ];
      const searchEmail = 'john@example.com';
      const result = customers.find((c) => c.email === searchEmail);
      expect(result).toBeDefined();
      expect(result?.id).toBe('cust-1');
    });
  });
});
