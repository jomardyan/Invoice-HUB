import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import logger from '@/utils/logger';
import { TemplateService } from './TemplateService';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateVariables?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: 'sendgrid' | 'ses' | 'smtp';
  error?: string;
  timestamp: Date;
}

export interface EmailQueueItem {
  id: string;
  options: EmailOptions;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastAttempt?: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

/**
 * Email delivery service with multiple provider support and failover
 */
export class EmailService {
  private transporters: Map<string, Transporter> = new Map();
  private queue: Map<string, EmailQueueItem> = new Map();
  private templateService: TemplateService;
  private primaryProvider: 'sendgrid' | 'ses' | 'smtp' = 'smtp';
  private failoverProvider: 'sendgrid' | 'ses' | 'smtp' = 'smtp';

  constructor() {
    this.templateService = new TemplateService();
    this.initializeTransporters();
  }

  /**
   * Initialize email transporters
   */
  private initializeTransporters(): void {
    // SMTP transporter (fallback)
    const smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    this.transporters.set('smtp', smtpTransporter);

    // SendGrid transporter
    if (process.env.SENDGRID_API_KEY) {
      const sendgridTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
      this.transporters.set('sendgrid', sendgridTransporter);
      this.primaryProvider = 'sendgrid';
    }

    // AWS SES transporter
    if (process.env.AWS_SES_REGION) {
      const sesTransporter = nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
        port: 587,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY || '',
          pass: process.env.AWS_SES_SECRET_KEY || '',
        },
      });
      this.transporters.set('ses', sesTransporter);
      if (!process.env.SENDGRID_API_KEY) {
        this.primaryProvider = 'ses';
      }
      this.failoverProvider = 'ses';
    }

    logger.info('Email transporters initialized', {
      primary: this.primaryProvider,
      failover: this.failoverProvider,
      available: Array.from(this.transporters.keys()),
    });
  }

  /**
   * Send email with automatic failover
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Prepare email content
      let html = options.html;
      let subject = options.subject;

      // Render template if templateId provided
      if (options.templateId && options.templateVariables) {
        const template = await this.templateService.getTemplateById(
          options.templateVariables.tenantId || 'default',
          options.templateId
        );

        if (template) {
          const rendered = await this.templateService.renderTemplate(template, {
            variables: options.templateVariables,
          });
          html = rendered.body;
          subject = rendered.subject || subject;
        }
      }

      const emailData = {
        from: process.env.EMAIL_FROM || 'noreply@invoice-hub.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject,
        html,
        text: options.text || this.htmlToText(html || ''),
        attachments: options.attachments,
        priority: options.priority || 'normal',
        headers: options.headers,
      };

      // Try primary provider
      try {
        const result = await this.sendWithProvider(this.primaryProvider, emailData);
        logger.info('Email sent successfully', {
          provider: this.primaryProvider,
          to: options.to,
          subject,
          messageId: result.messageId,
        });
        return {
          success: true,
          messageId: result.messageId,
          provider: this.primaryProvider,
          timestamp: new Date(),
        };
      } catch (primaryError: any) {
        logger.warn('Primary email provider failed, trying failover', {
          provider: this.primaryProvider,
          error: primaryError.message,
        });

        // Try failover provider
        if (this.failoverProvider !== this.primaryProvider) {
          try {
            const result = await this.sendWithProvider(this.failoverProvider, emailData);
            logger.info('Email sent via failover provider', {
              provider: this.failoverProvider,
              to: options.to,
              subject,
              messageId: result.messageId,
            });
            return {
              success: true,
              messageId: result.messageId,
              provider: this.failoverProvider,
              timestamp: new Date(),
            };
          } catch (failoverError: any) {
            logger.error('Failover email provider also failed', {
              provider: this.failoverProvider,
              error: failoverError.message,
            });
            throw failoverError;
          }
        }

        throw primaryError;
      }
    } catch (error: any) {
      logger.error('Email sending failed completely', { error: error.message, options });
      return {
        success: false,
        error: error.message,
        provider: this.primaryProvider,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send email with specific provider
   */
  private async sendWithProvider(
    provider: 'sendgrid' | 'ses' | 'smtp',
    emailData: any
  ): Promise<SentMessageInfo> {
    const transporter = this.transporters.get(provider);
    if (!transporter) {
      throw new Error(`Email provider ${provider} not configured`);
    }

    return await transporter.sendMail(emailData);
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info('Bulk email sending completed', {
      total: emails.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    customerEmail: string,
    invoiceData: {
      invoiceNumber: string;
      companyName: string;
      customerName: string;
      totalAmount: number;
      dueDate: Date;
      invoiceUrl?: string;
      pdfAttachment?: Buffer;
    }
  ): Promise<EmailResult> {
    const template = await this.templateService.getDefaultTemplate('default', 'email');

    return this.sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceData.invoiceNumber} from ${invoiceData.companyName}`,
      templateId: template?.id,
      templateVariables: {
        recipientName: invoiceData.customerName,
        recipientEmail: customerEmail,
        companyName: invoiceData.companyName,
        invoiceNumber: invoiceData.invoiceNumber,
        totalAmount: invoiceData.totalAmount,
        dueDate: invoiceData.dueDate.toLocaleDateString(),
        actionUrl: invoiceData.invoiceUrl || '#',
      },
      attachments: invoiceData.pdfAttachment
        ? [
            {
              filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
              content: invoiceData.pdfAttachment,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(
    customerEmail: string,
    reminderData: {
      invoiceNumber: string;
      companyName: string;
      customerName: string;
      totalAmount: number;
      dueDate: Date;
      daysOverdue: number;
      paymentUrl?: string;
    }
  ): Promise<EmailResult> {
    const template = await this.templateService.getDefaultTemplate('default', 'reminder');

    return this.sendEmail({
      to: customerEmail,
      subject: `Payment Reminder: Invoice ${reminderData.invoiceNumber}`,
      templateId: template?.id,
      templateVariables: {
        recipientName: reminderData.customerName,
        companyName: reminderData.companyName,
        invoiceNumber: reminderData.invoiceNumber,
        totalAmount: reminderData.totalAmount,
        dueDate: reminderData.dueDate.toLocaleDateString(),
        paymentUrl: reminderData.paymentUrl || '#',
        daysOverdue: reminderData.daysOverdue,
      },
      priority: reminderData.daysOverdue > 7 ? 'high' : 'normal',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetData: {
      name: string;
      resetToken: string;
      resetUrl: string;
    }
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${resetData.name},</p>
        <p>We received a request to reset your password. Click the link below to reset your password:</p>
        <p><a href="${resetData.resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Best regards,<br>Invoice Hub Team</p>
      `,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    userData: {
      name: string;
      companyName?: string;
      loginUrl: string;
    }
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Invoice Hub!',
      html: `
        <h2>Welcome to Invoice Hub!</h2>
        <p>Hello ${userData.name},</p>
        <p>Thank you for registering${userData.companyName ? ` with ${userData.companyName}` : ''}. Your account has been created successfully.</p>
        <p>You can now start creating and managing your invoices.</p>
        <p><a href="${userData.loginUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>Invoice Hub Team</p>
      `,
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConfiguration(): Promise<{
    smtp: boolean;
    sendgrid: boolean;
    ses: boolean;
  }> {
    const results = {
      smtp: false,
      sendgrid: false,
      ses: false,
    };

    for (const [provider, transporter] of this.transporters.entries()) {
      try {
        await transporter.verify();
        results[provider as keyof typeof results] = true;
        logger.info(`Email provider ${provider} verified successfully`);
      } catch (error: any) {
        logger.warn(`Email provider ${provider} verification failed`, { error: error.message });
      }
    }

    return results;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<{
    queueSize: number;
    pending: number;
    sent: number;
    failed: number;
  }> {
    const items = Array.from(this.queue.values());
    return {
      queueSize: this.queue.size,
      pending: items.filter((i) => i.status === 'pending').length,
      sent: items.filter((i) => i.status === 'sent').length,
      failed: items.filter((i) => i.status === 'failed').length,
    };
  }
}

export default new EmailService();
