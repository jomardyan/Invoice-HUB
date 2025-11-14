import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';

export interface TemplateCreateInput {
  name: string;
  description?: string;
  type: 'invoice' | 'email' | 'sms' | 'reminder';
  subject?: string;
  body: string;
  variables?: string[];
  isDefault?: boolean;
  settings?: Record<string, any>;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isDefault?: boolean;
  settings?: Record<string, any>;
}

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'invoice' | 'email' | 'sms' | 'reminder';
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateRenderInput {
  variables: Record<string, any>;
  fallbackValues?: Record<string, string>;
}

export interface RenderedTemplate {
  subject?: string;
  body: string;
  variables: Record<string, any>;
  renderedAt: Date;
}

/**
 * Supported template variables for different template types
 */
const SUPPORTED_VARIABLES = {
  invoice: [
    'invoiceNumber',
    'invoiceDate',
    'dueDate',
    'companyName',
    'companyNIP',
    'companyAddress',
    'customerName',
    'customerEmail',
    'customerAddress',
    'totalAmount',
    'taxAmount',
    'netAmount',
    'paymentTerms',
    'bankAccount',
    'invoiceUrl',
    'items',
    'notes',
  ],
  email: [
    'recipientName',
    'recipientEmail',
    'subject',
    'message',
    'actionUrl',
    'companyName',
    'senderName',
  ],
  sms: ['recipientName', 'companyName', 'invoiceNumber', 'actionUrl', 'amount'],
  reminder: [
    'invoiceNumber',
    'dueDate',
    'customerName',
    'companyName',
    'totalAmount',
    'paymentUrl',
  ],
};

export class TemplateService {
  private templates: Map<string, Template> = new Map();

  constructor() {
    // Initialize with default templates
    this.initializeDefaults();
  }

  /**
   * Initialize default templates
   */
  private initializeDefaults(): void {
    // Default invoice template
    const defaultInvoiceTemplate: Template = {
      id: uuidv4(),
      tenantId: 'default',
      name: 'Standard Invoice',
      description: 'Default invoice template with standard layout',
      type: 'invoice',
      subject: '',
      body: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .header { text-align: center; margin-bottom: 30px; }
      .company-info { margin-bottom: 30px; }
      .invoice-details { margin-bottom: 30px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #f8f9fa; font-weight: bold; }
      .total-section { text-align: right; margin-top: 20px; }
      .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>INVOICE</h1>
      <p><strong>{{invoiceNumber}}</strong></p>
    </div>

    <div class="company-info">
      <h3>{{companyName}}</h3>
      <p>{{companyAddress}}</p>
      <p>NIP: {{companyNIP}}</p>
    </div>

    <div class="invoice-details">
      <h3>Bill To:</h3>
      <p><strong>{{customerName}}</strong></p>
      <p>{{customerAddress}}</p>
      <p>{{customerEmail}}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>VAT Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {{#items}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>{{unitPrice}}</td>
          <td>{{vatRate}}%</td>
          <td>{{grossAmount}}</td>
        </tr>
        {{/items}}
      </tbody>
    </table>

    <div class="total-section">
      <p><strong>Subtotal:</strong> {{netAmount}} PLN</p>
      <p><strong>Tax:</strong> {{taxAmount}} PLN</p>
      <p style="font-size: 16px;"><strong>Total:</strong> {{totalAmount}} PLN</p>
    </div>

    <div class="invoice-details">
      <h3>Payment Details</h3>
      <p><strong>Bank Account:</strong> {{bankAccount}}</p>
      <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
    </div>

    {{#notes}}
    <div class="invoice-details">
      <h3>Notes</h3>
      <p>{{notes}}</p>
    </div>
    {{/notes}}

    <div class="footer">
      <p>Thank you for your business!</p>
    </div>
  </body>
</html>
      `,
      variables: SUPPORTED_VARIABLES.invoice,
      isDefault: true,
      settings: {
        paperSize: 'A4',
        orientation: 'portrait',
        margin: '20mm',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Default payment reminder email template
    const defaultEmailTemplate: Template = {
      id: uuidv4(),
      tenantId: 'default',
      name: 'Payment Reminder Email',
      description: 'Email reminder for pending invoices',
      type: 'email',
      subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
      body: `
Dear {{recipientName}},

We wanted to remind you about the outstanding invoice {{invoiceNumber}} dated {{invoiceDate}}.

Invoice Details:
- Amount Due: {{totalAmount}} PLN
- Due Date: {{dueDate}}

If you have already processed this payment, please disregard this notice.

To view and pay your invoice, please visit: {{actionUrl}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{senderName}}
{{companyName}}
      `,
      variables: SUPPORTED_VARIABLES.email,
      isDefault: true,
      settings: {
        htmlEnabled: true,
        retryCount: 3,
        retryInterval: 86400000, // 1 day in milliseconds
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Default SMS reminder template
    const defaultSmsTemplate: Template = {
      id: uuidv4(),
      tenantId: 'default',
      name: 'Payment Reminder SMS',
      description: 'SMS reminder for pending payments',
      type: 'sms',
      subject: '',
      body: 'Hello {{recipientName}}, reminder: Invoice {{invoiceNumber}} for {{amount}} PLN is due. Pay now: {{actionUrl}}',
      variables: SUPPORTED_VARIABLES.sms,
      isDefault: true,
      settings: {
        maxLength: 160,
        chargePerMessage: 0.5,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set('default:invoice:standard', defaultInvoiceTemplate);
    this.templates.set('default:email:reminder', defaultEmailTemplate);
    this.templates.set('default:sms:reminder', defaultSmsTemplate);
  }

  /**
   * Create a new template
   */
  async createTemplate(tenantId: string, input: TemplateCreateInput): Promise<Template> {
    try {
      // Validate variables are supported
      const supportedVars = SUPPORTED_VARIABLES[input.type];
      if (input.variables) {
        const invalidVars = input.variables.filter((v) => !supportedVars.includes(v));
        if (invalidVars.length > 0) {
          throw new Error(`Invalid variables for ${input.type} template: ${invalidVars.join(', ')}`);
        }
      }

      const template: Template = {
        id: uuidv4(),
        tenantId,
        name: input.name,
        description: input.description || '',
        type: input.type,
        subject: input.subject || '',
        body: input.body,
        variables: input.variables || this.extractVariablesFromTemplate(input.body),
        isDefault: input.isDefault || false,
        settings: input.settings || this.getDefaultSettings(input.type),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // If marking as default, unset other defaults of this type
      if (template.isDefault) {
        for (const [_key, t] of this.templates.entries()) {
          if (t.tenantId === tenantId && t.type === input.type && t.isDefault) {
            t.isDefault = false;
          }
        }
      }

      const key = `${tenantId}:${input.type}:${input.name}`;
      this.templates.set(key, template);

      logger.info(`Template created: ${input.name}`, { tenantId, templateId: template.id });
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(tenantId: string, templateId: string): Promise<Template | null> {
    try {
      for (const template of this.templates.values()) {
        if (template.id === templateId && template.tenantId === tenantId) {
          return template;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error retrieving template:', error);
      throw error;
    }
  }

  /**
   * List templates by type
   */
  async listTemplates(
    tenantId: string,
    type?: 'invoice' | 'email' | 'sms' | 'reminder'
  ): Promise<Template[]> {
    try {
      const templates: Template[] = [];
      for (const template of this.templates.values()) {
        if (template.tenantId === tenantId && (!type || template.type === type)) {
          templates.push(template);
        }
      }
      return templates;
    } catch (error) {
      logger.error('Error listing templates:', error);
      throw error;
    }
  }

  /**
   * Get default template by type
   */
  async getDefaultTemplate(
    tenantId: string,
    type: 'invoice' | 'email' | 'sms' | 'reminder'
  ): Promise<Template | null> {
    try {
      // First look for tenant-specific default
      for (const template of this.templates.values()) {
        if (template.tenantId === tenantId && template.type === type && template.isDefault) {
          return template;
        }
      }

      // Fall back to system default
      for (const template of this.templates.values()) {
        if (template.tenantId === 'default' && template.type === type && template.isDefault) {
          return template;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error retrieving default template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    tenantId: string,
    templateId: string,
    input: TemplateUpdateInput
  ): Promise<Template> {
    try {
      const template = await this.getTemplateById(tenantId, templateId);
      if (!template) throw new Error('Template not found');

      if (input.name !== undefined) template.name = input.name;
      if (input.description !== undefined) template.description = input.description;
      if (input.subject !== undefined) template.subject = input.subject;
      if (input.body !== undefined) template.body = input.body;
      if (input.variables !== undefined) {
        const supportedVars = SUPPORTED_VARIABLES[template.type];
        const invalidVars = input.variables.filter((v) => !supportedVars.includes(v));
        if (invalidVars.length > 0) {
          throw new Error(`Invalid variables: ${invalidVars.join(', ')}`);
        }
        template.variables = input.variables;
      }
      if (input.settings !== undefined) template.settings = input.settings;

      if (input.isDefault !== undefined) {
        if (input.isDefault) {
          // Unset other defaults of this type
          for (const t of this.templates.values()) {
            if (t.tenantId === tenantId && t.type === template.type && t.id !== templateId) {
              t.isDefault = false;
            }
          }
        }
        template.isDefault = input.isDefault;
      }

      template.updatedAt = new Date();

      logger.info(`Template updated: ${template.name}`, { tenantId, templateId });
      return template;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    try {
      for (const [key, template] of this.templates.entries()) {
        if (template.id === templateId && template.tenantId === tenantId) {
          this.templates.delete(key);
          logger.info(`Template deleted: ${template.name}`, { tenantId, templateId });
          return;
        }
      }
      throw new Error('Template not found');
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  async renderTemplate(
    template: Template,
    input: TemplateRenderInput
  ): Promise<RenderedTemplate> {
    try {
      let body = template.body;
      let subject = template.subject;

      // Replace simple variables {{variableName}}
      for (const [key, value] of Object.entries(input.variables)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const stringValue = String(value ?? input.fallbackValues?.[key] ?? '');
        body = body.replace(placeholder, stringValue);
        subject = subject.replace(placeholder, stringValue);
      }

      // Handle conditional blocks {{#variableName}}...{{/variableName}}
      body = this.processConditionalBlocks(body, input.variables);

      // Handle array loops {{#array}}...{{/array}}
      body = this.processArrayLoops(body, input.variables);

      return {
        subject: subject || undefined,
        body,
        variables: input.variables,
        renderedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Validate template syntax
   */
  async validateTemplate(template: Template): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];

      // Check for unmatched braces
      const openBraces = (template.body.match(/{/g) || []).length;
      const closeBraces = (template.body.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push('Unmatched braces in template body');
      }

      // Check for undefined variables
      const variablePattern = /{{([^}]+)}}/g;
      let match;
      const usedVariables = new Set<string>();
      while ((match = variablePattern.exec(template.body)) !== null) {
        const varName = match[1].trim().split(/\s+/)[0]; // Get first word (for conditionals)
        usedVariables.add(varName);
      }

      const supportedVars = SUPPORTED_VARIABLES[template.type];
      for (const varName of usedVariables) {
        if (!supportedVars.includes(varName) && varName !== 'items') {
          errors.push(`Undefined variable: {{${varName}}}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Error validating template:', error);
      throw error;
    }
  }

  /**
   * Extract variables from template body
   */
  private extractVariablesFromTemplate(body: string): string[] {
    const variables = new Set<string>();
    const pattern = /{{([^}]+)}}/g;
    let match;

    while ((match = pattern.exec(body)) !== null) {
      const varName = match[1].trim().split(/\s+/)[0];
      if (varName && !varName.startsWith('#')) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  private processConditionalBlocks(template: string, variables: Record<string, any>): string {
    const conditionalPattern = /{{#([^}]+)}}([\s\S]*?){{\/\1}}/g;
    return template.replace(conditionalPattern, (_match, varName, content) => {
      const value = variables[varName.trim()];
      return value && value !== false ? content : '';
    });
  }

  /**
   * Process array loops
   */
  private processArrayLoops(template: string, variables: Record<string, any>): string {
    const loopPattern = /{{#([^}]+)}}([\s\S]*?){{\/\1}}/g;
    return template.replace(loopPattern, (_match, arrayName, content) => {
      const arrayName_ = arrayName.trim();
      const array = variables[arrayName_];

      if (!Array.isArray(array)) {
        return '';
      }

      return array
        .map((item) => {
          let itemContent = content;
          if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
              const placeholder = new RegExp(`{{${key}}}`, 'g');
              itemContent = itemContent.replace(placeholder, String(value ?? ''));
            }
          }
          return itemContent;
        })
        .join('');
    });
  }

  /**
   * Get default settings for template type
   */
  private getDefaultSettings(type: string): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      invoice: {
        paperSize: 'A4',
        orientation: 'portrait',
        margin: '20mm',
      },
      email: {
        htmlEnabled: true,
        retryCount: 3,
        retryInterval: 86400000,
      },
      sms: {
        maxLength: 160,
        chargePerMessage: 0.5,
      },
      reminder: {
        reminderDays: 3,
        maxReminders: 3,
      },
    };

    return defaults[type] || {};
  }

  /**
   * Clone a template
   */
  async cloneTemplate(
    tenantId: string,
    templateId: string,
    newName: string
  ): Promise<Template> {
    try {
      const original = await this.getTemplateById(tenantId, templateId);
      if (!original) throw new Error('Template not found');

      return this.createTemplate(tenantId, {
        name: newName,
        description: `Clone of ${original.name}`,
        type: original.type,
        subject: original.subject,
        body: original.body,
        variables: original.variables,
        settings: original.settings,
      });
    } catch (error) {
      logger.error('Error cloning template:', error);
      throw error;
    }
  }
}

export default new TemplateService();
