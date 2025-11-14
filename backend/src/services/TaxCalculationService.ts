import logger from '@/utils/logger';

export interface TaxRate {
  countryCode: string;
  standard: number;
  reduced: number;
  superReduced: number;
  zero: number;
}

export interface TaxCalculationInput {
  netAmount: number;
  vatRate: number;
  discountPercent?: number;
  countryCode?: string;
}

export interface TaxCalculationResult {
  netAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grossAmount: number;
  vatRate: number;
  calculatedAt: Date;
}

// Polish VAT rates
const POLISH_VAT_RATES = {
  STANDARD: 23,
  REDUCED: 8,
  SUPER_REDUCED: 5,
  ZERO: 0,
};

// EU VAT rates by country (simplified)
const EU_VAT_RATES: Record<string, TaxRate> = {
  PL: {
    countryCode: 'PL',
    standard: 23,
    reduced: 8,
    superReduced: 5,
    zero: 0,
  },
  DE: {
    countryCode: 'DE',
    standard: 19,
    reduced: 7,
    superReduced: 0,
    zero: 0,
  },
  FR: {
    countryCode: 'FR',
    standard: 20,
    reduced: 5.5,
    superReduced: 2.1,
    zero: 0,
  },
  IT: {
    countryCode: 'IT',
    standard: 22,
    reduced: 10,
    superReduced: 5,
    zero: 0,
  },
  ES: {
    countryCode: 'ES',
    standard: 21,
    reduced: 10,
    superReduced: 4,
    zero: 0,
  },
  UK: {
    countryCode: 'UK',
    standard: 20,
    reduced: 5,
    superReduced: 0,
    zero: 0,
  },
  SE: {
    countryCode: 'SE',
    standard: 25,
    reduced: 12,
    superReduced: 6,
    zero: 0,
  },
  NL: {
    countryCode: 'NL',
    standard: 21,
    reduced: 9,
    superReduced: 0,
    zero: 0,
  },
  CZ: {
    countryCode: 'CZ',
    standard: 21,
    reduced: 15,
    superReduced: 10,
    zero: 0,
  },
};

export class TaxCalculationService {
  /**
   * Calculate tax on a single line item
   */
  calculateLineTax(input: TaxCalculationInput): TaxCalculationResult {
    try {
      const { netAmount, vatRate, discountPercent = 0 } = input;

      // Calculate discount
      const discountAmount = (netAmount * discountPercent) / 100;
      const taxableAmount = netAmount - discountAmount;

      // Calculate tax
      const taxAmount = (taxableAmount * vatRate) / 100;
      const grossAmount = taxableAmount + taxAmount;

      return {
        netAmount,
        discountAmount,
        taxableAmount,
        taxAmount: Math.round(taxAmount * 100) / 100,
        grossAmount: Math.round(grossAmount * 100) / 100,
        vatRate,
        calculatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Tax calculation error:', error);
      throw new Error('Failed to calculate tax');
    }
  }

  /**
   * Calculate tax for multiple line items
   */
  calculateMultipleLines(
    items: TaxCalculationInput[]
  ): { items: TaxCalculationResult[]; summary: TaxSummary } {
    try {
      const calculatedItems = items.map((item) => this.calculateLineTax(item));

      const summary = this.calculateTaxSummary(calculatedItems);

      return { items: calculatedItems, summary };
    } catch (error) {
      logger.error('Multiple lines tax calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate tax summary
   */
  calculateTaxSummary(items: TaxCalculationResult[]): TaxSummary {
    const totals = items.reduce(
      (acc, item) => ({
        netAmount: acc.netAmount + item.netAmount,
        discountAmount: acc.discountAmount + item.discountAmount,
        taxableAmount: acc.taxableAmount + item.taxableAmount,
        taxAmount: acc.taxAmount + item.taxAmount,
        grossAmount: acc.grossAmount + item.grossAmount,
      }),
      {
        netAmount: 0,
        discountAmount: 0,
        taxableAmount: 0,
        taxAmount: 0,
        grossAmount: 0,
      }
    );

    return {
      netAmount: Math.round(totals.netAmount * 100) / 100,
      discountAmount: Math.round(totals.discountAmount * 100) / 100,
      taxableAmount: Math.round(totals.taxableAmount * 100) / 100,
      taxAmount: Math.round(totals.taxAmount * 100) / 100,
      grossAmount: Math.round(totals.grossAmount * 100) / 100,
    };
  }

  /**
   * Get VAT rate by country code
   */
  getVATRateByCountry(
    countryCode: string,
    rateType: 'standard' | 'reduced' | 'superReduced' | 'zero' = 'standard'
  ): number {
    const rates = EU_VAT_RATES[countryCode];
    if (!rates) {
      logger.warn(`VAT rates not found for country: ${countryCode}, using PL standard`);
      return POLISH_VAT_RATES.STANDARD;
    }

    return rates[rateType];
  }

  /**
   * Validate VAT-EU number (VIES validation pattern)
   */
  validateVAT_EUNumber(vatNumber: string, countryCode: string): boolean {
    try {
      // Remove spaces and hyphens
      const cleaned = vatNumber.replace(/[\s-]/g, '');

      // VAT number should start with country code
      if (!cleaned.startsWith(countryCode)) {
        return false;
      }

      // VAT number should have correct length (country code + digits)
      // Most EU countries have 8-12 digits after country code
      const numberPart = cleaned.substring(2);
      if (!/^\d{8,12}$/.test(numberPart)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('VAT-EU validation error:', error);
      return false;
    }
  }

  /**
   * Validate Polish NIP (10 digits)
   */
  validatePolishNIP(nip: string): boolean {
    try {
      const cleaned = nip.replace(/[\s-]/g, '');

      if (!/^\d{10}$/.test(cleaned)) {
        return false;
      }

      // NIP checksum validation using weights
      const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * weights[i];
      }

      const checksum = (10 - (sum % 10)) % 10;
      return checksum === parseInt(cleaned[9]);
    } catch (error) {
      logger.error('NIP validation error:', error);
      return false;
    }
  }

  /**
   * Calculate reverse charge mechanism for B2B EU transactions
   */
  calculateReverseCharge(
    netAmount: number,
    buyerCountry: string
  ): {
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
    reverseChargeApplied: boolean;
    reason: string;
  } {
    // Reverse charge applies to B2B EU transactions where seller and buyer are in different EU countries
    const reverseChargeApplied = buyerCountry !== 'PL' && buyerCountry in EU_VAT_RATES;

    return {
      netAmount,
      taxAmount: reverseChargeApplied ? 0 : (netAmount * POLISH_VAT_RATES.STANDARD) / 100,
      grossAmount: reverseChargeApplied
        ? netAmount
        : netAmount + (netAmount * POLISH_VAT_RATES.STANDARD) / 100,
      reverseChargeApplied,
      reason: reverseChargeApplied
        ? `Reverse charge mechanism applied for B2B transaction to ${buyerCountry}`
        : 'Standard taxation applied',
    };
  }

  /**
   * Check if product qualifies for reduced VAT rate (e.g., books, food)
   */
  isReducedVATProduct(productCategory: string): boolean {
    const reducedVATCategories = ['books', 'food', 'medicine', 'newspapers', 'children_clothing'];
    return reducedVATCategories.includes(productCategory.toLowerCase());
  }

  /**
   * Check if product is VAT exempt
   */
  isVATExemptProduct(productCategory: string): boolean {
    const exemptCategories = ['health_services', 'education', 'cultural_activities', 'insurance'];
    return exemptCategories.includes(productCategory.toLowerCase());
  }

  /**
   * Get tax breakdown by rate
   */
  getTaxBreakdownByRate(items: TaxCalculationResult[]): TaxBreakdown[] {
    const breakdown: Record<number, TaxBreakdown> = {};

    items.forEach((item) => {
      if (!breakdown[item.vatRate]) {
        breakdown[item.vatRate] = {
          vatRate: item.vatRate,
          netAmount: 0,
          taxAmount: 0,
          grossAmount: 0,
        };
      }

      breakdown[item.vatRate].netAmount += item.taxableAmount;
      breakdown[item.vatRate].taxAmount += item.taxAmount;
      breakdown[item.vatRate].grossAmount += item.grossAmount;
    });

    return Object.values(breakdown).map((bd) => ({
      ...bd,
      netAmount: Math.round(bd.netAmount * 100) / 100,
      taxAmount: Math.round(bd.taxAmount * 100) / 100,
      grossAmount: Math.round(bd.grossAmount * 100) / 100,
    }));
  }
}

export interface TaxSummary {
  netAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grossAmount: number;
}

export interface TaxBreakdown {
  vatRate: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
}

export default new TaxCalculationService();
