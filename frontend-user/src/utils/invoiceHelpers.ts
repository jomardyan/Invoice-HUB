/**
 * Format currency value for display
 */
export const formatCurrency = (amount: number, currency: string = 'PLN'): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
    }).format(amount);
};

/**
 * Calculate VAT amount from net amount and VAT rate
 */
export const calculateVAT = (netAmount: number, vatRate: number): number => {
    return (netAmount * vatRate) / 100;
};

/**
 * Calculate gross amount from net amount and VAT rate
 */
export const calculateGross = (netAmount: number, vatRate: number): number => {
    return netAmount + calculateVAT(netAmount, vatRate);
};

/**
 * Validate Polish NIP (tax identification number)
 */
export const validateNIP = (nip: string): boolean => {
    // Remove any non-digit characters
    const cleanNIP = nip.replace(/\D/g, '');

    // NIP must be exactly 10 digits
    if (cleanNIP.length !== 10) {
        return false;
    }

    // Calculate checksum
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanNIP[i]) * weights[i];
    }

    const checksum = sum % 11;
    const lastDigit = parseInt(cleanNIP[9]);

    return checksum === lastDigit;
};

/**
 * Format NIP with dashes
 */
export const formatNIP = (nip: string): string => {
    const cleanNIP = nip.replace(/\D/g, '');
    if (cleanNIP.length !== 10) {
        return nip;
    }
    return `${cleanNIP.slice(0, 3)}-${cleanNIP.slice(3, 6)}-${cleanNIP.slice(6, 8)}-${cleanNIP.slice(8)}`;
};

/**
 * Calculate invoice total from line items
 */
export interface InvoiceItem {
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discount?: number;
}

export const calculateInvoiceTotal = (items: InvoiceItem[]): {
    netTotal: number;
    vatTotal: number;
    grossTotal: number;
} => {
    let netTotal = 0;
    let vatTotal = 0;

    items.forEach((item) => {
        const lineNet = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        const lineVat = calculateVAT(lineNet, item.vatRate);

        netTotal += lineNet;
        vatTotal += lineVat;
    });

    return {
        netTotal,
        vatTotal,
        grossTotal: netTotal + vatTotal,
    };
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = (year: number, month: number, sequence: number): string => {
    const monthStr = month.toString().padStart(2, '0');
    const seqStr = sequence.toString().padStart(4, '0');
    return `INV-${year}-${monthStr}-${seqStr}`;
};
