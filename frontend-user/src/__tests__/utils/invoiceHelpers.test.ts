import { describe, it, expect } from '@jest/globals';
import {
    formatCurrency,
    calculateVAT,
    calculateGross,
    validateNIP,
    formatNIP,
    calculateInvoiceTotal,
    generateInvoiceNumber,
} from '../../utils/invoiceHelpers';

describe('invoiceHelpers', () => {
    describe('formatCurrency', () => {
        it('should format PLN currency correctly', () => {
            const result = formatCurrency(1000);
            expect(result).toContain('1');
            expect(result).toContain('000');
        });

        it('should format EUR currency correctly', () => {
            const result = formatCurrency(1000, 'EUR');
            expect(result).toContain('1');
            expect(result).toContain('000');
        });
    });

    describe('calculateVAT', () => {
        it('should calculate 23% VAT correctly', () => {
            expect(calculateVAT(100, 23)).toBe(23);
        });

        it('should calculate 8% VAT correctly', () => {
            expect(calculateVAT(100, 8)).toBe(8);
        });

        it('should handle 0% VAT', () => {
            expect(calculateVAT(100, 0)).toBe(0);
        });

        it('should handle decimal amounts', () => {
            expect(calculateVAT(123.45, 23)).toBeCloseTo(28.39, 2);
        });
    });

    describe('calculateGross', () => {
        it('should calculate gross amount correctly', () => {
            expect(calculateGross(100, 23)).toBe(123);
        });

        it('should handle 0% VAT', () => {
            expect(calculateGross(100, 0)).toBe(100);
        });

        it('should handle decimal amounts', () => {
            expect(calculateGross(123.45, 23)).toBeCloseTo(151.84, 2);
        });
    });

    describe('validateNIP', () => {
        it('should validate correct NIP', () => {
            expect(validateNIP('1234563218')).toBe(true);
            expect(validateNIP('5260250274')).toBe(true);
        });

        it('should reject NIP with wrong length', () => {
            expect(validateNIP('123456')).toBe(false);
            expect(validateNIP('12345678901')).toBe(false);
        });

        it('should reject NIP with invalid checksum', () => {
            expect(validateNIP('1234567890')).toBe(false);
        });

        it('should handle NIP with dashes', () => {
            expect(validateNIP('123-456-32-18')).toBe(true);
        });

        it('should handle NIP with spaces', () => {
            expect(validateNIP('123 456 32 18')).toBe(true);
        });
    });

    describe('formatNIP', () => {
        it('should format NIP with dashes', () => {
            expect(formatNIP('1234567890')).toBe('123-456-78-90');
        });

        it('should handle already formatted NIP', () => {
            expect(formatNIP('123-456-78-90')).toBe('123-456-78-90');
        });

        it('should not format invalid length NIP', () => {
            expect(formatNIP('12345')).toBe('12345');
        });
    });

    describe('calculateInvoiceTotal', () => {
        it('should calculate total for single item', () => {
            const items = [
                { quantity: 2, unitPrice: 100, vatRate: 23 },
            ];

            const result = calculateInvoiceTotal(items);

            expect(result.netTotal).toBe(200);
            expect(result.vatTotal).toBe(46);
            expect(result.grossTotal).toBe(246);
        });

        it('should calculate total for multiple items', () => {
            const items = [
                { quantity: 2, unitPrice: 100, vatRate: 23 },
                { quantity: 1, unitPrice: 50, vatRate: 8 },
            ];

            const result = calculateInvoiceTotal(items);

            expect(result.netTotal).toBe(250);
            expect(result.vatTotal).toBeCloseTo(50, 0);
            expect(result.grossTotal).toBeCloseTo(300, 0);
        });

        it('should handle discount', () => {
            const items = [
                { quantity: 1, unitPrice: 100, vatRate: 23, discount: 10 },
            ];

            const result = calculateInvoiceTotal(items);

            expect(result.netTotal).toBe(90);
            expect(result.vatTotal).toBeCloseTo(20.7, 1);
            expect(result.grossTotal).toBeCloseTo(110.7, 1);
        });

        it('should handle 0% VAT items', () => {
            const items = [
                { quantity: 1, unitPrice: 100, vatRate: 0 },
            ];

            const result = calculateInvoiceTotal(items);

            expect(result.netTotal).toBe(100);
            expect(result.vatTotal).toBe(0);
            expect(result.grossTotal).toBe(100);
        });

        it('should handle empty items array', () => {
            const result = calculateInvoiceTotal([]);

            expect(result.netTotal).toBe(0);
            expect(result.vatTotal).toBe(0);
            expect(result.grossTotal).toBe(0);
        });
    });

    describe('generateInvoiceNumber', () => {
        it('should generate invoice number correctly', () => {
            expect(generateInvoiceNumber(2025, 11, 1)).toBe('INV-2025-11-0001');
        });

        it('should pad month with zero', () => {
            expect(generateInvoiceNumber(2025, 1, 1)).toBe('INV-2025-01-0001');
        });

        it('should pad sequence with zeros', () => {
            expect(generateInvoiceNumber(2025, 11, 42)).toBe('INV-2025-11-0042');
        });

        it('should handle large sequence numbers', () => {
            expect(generateInvoiceNumber(2025, 12, 9999)).toBe('INV-2025-12-9999');
        });
    });
});
