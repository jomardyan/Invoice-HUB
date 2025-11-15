export interface InvoiceItemForm {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export interface InvoiceFormData {
  companyId: string;
  customerId: string;
  invoiceType: 'vat' | 'proforma' | 'corrective';
  issueDate: string;
  dueDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'card' | 'online' | 'other';
  currency: string;
  items: InvoiceItemForm[];
  notes?: string;
  terms?: string;
}
