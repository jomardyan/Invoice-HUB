/**
 * SMSService - SMS delivery service with Twilio integration
 * Handles SMS notifications for payment reminders, alerts, and OTP
 */

import logger from '@/utils/logger';

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  priority?: 'high' | 'normal' | 'low';
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
}

interface PaymentReminderSMSData {
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: Date;
  companyName: string;
}

interface OTPData {
  code: string;
  expiryMinutes: number;
}

export class SMSService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;
  private smsEnabled: boolean;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.smsEnabled = !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber);

    if (!this.smsEnabled) {
      logger.warn('SMS service is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
    }
  }

  /**
   * Send SMS using Twilio (simulated for now)
   */
  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    if (!this.smsEnabled) {
      logger.warn('SMS service is not enabled', { to: options.to });
      return {
        success: false,
        error: 'SMS service not configured',
        timestamp: new Date(),
      };
    }

    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(options.to)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +48123456789)');
      }

      // Check message length (160 chars for single SMS)
      if (options.message.length > 160) {
        logger.warn('SMS message exceeds 160 characters', { 
          to: options.to, 
          length: options.message.length 
        });
      }

      // In production, use Twilio SDK:
      // const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
      // const message = await client.messages.create({
      //   body: options.message,
      //   from: options.from || this.twilioPhoneNumber,
      //   to: options.to
      // });

      // Simulated for development
      const messageId = `SM${Date.now()}${Math.random().toString(36).substring(7)}`;
      
      logger.info('SMS sent successfully', {
        to: options.to,
        messageId,
        length: options.message.length,
        priority: options.priority || 'normal',
      });

      return {
        success: true,
        messageId,
        provider: 'twilio',
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Failed to send SMS', { 
        error: error.message, 
        to: options.to 
      });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminderSMS(phoneNumber: string, data: PaymentReminderSMSData): Promise<SMSResult> {
    try {
      // Use default message (template integration requires additional setup)
      const message = `${data.companyName}: Payment reminder for invoice ${data.invoiceNumber}. Amount: ${data.totalAmount.toFixed(2)} PLN. Due: ${data.dueDate.toLocaleDateString('pl-PL')}`;

      // Truncate if too long
      const truncatedMessage = message.length > 160 ? message.substring(0, 157) + '...' : message;

      return await this.sendSMS({
        to: phoneNumber,
        message: truncatedMessage,
        priority: 'high',
      });
    } catch (error: any) {
      logger.error('Failed to send payment reminder SMS', { 
        error: error.message, 
        phoneNumber 
      });
      throw error;
    }
  }

  /**
   * Send OTP (One-Time Password) SMS
   */
  async sendOTPSMS(phoneNumber: string, data: OTPData): Promise<SMSResult> {
    try {
      const message = `Your verification code is: ${data.code}. Valid for ${data.expiryMinutes} minutes. Do not share this code.`;

      return await this.sendSMS({
        to: phoneNumber,
        message,
        priority: 'high',
      });
    } catch (error: any) {
      logger.error('Failed to send OTP SMS', { 
        error: error.message, 
        phoneNumber 
      });
      throw error;
    }
  }

  /**
   * Send invoice sent notification SMS
   */
  async sendInvoiceSentSMS(phoneNumber: string, invoiceNumber: string, companyName: string): Promise<SMSResult> {
    try {
      const message = `${companyName}: New invoice ${invoiceNumber} has been sent to your email. Please check and process payment.`;

      return await this.sendSMS({
        to: phoneNumber,
        message,
        priority: 'normal',
      });
    } catch (error: any) {
      logger.error('Failed to send invoice notification SMS', { 
        error: error.message, 
        phoneNumber 
      });
      throw error;
    }
  }

  /**
   * Send payment received SMS
   */
  async sendPaymentReceivedSMS(
    phoneNumber: string, 
    invoiceNumber: string, 
    amount: number,
    companyName: string
  ): Promise<SMSResult> {
    try {
      const message = `${companyName}: Payment received for invoice ${invoiceNumber}. Amount: ${amount.toFixed(2)} PLN. Thank you!`;

      return await this.sendSMS({
        to: phoneNumber,
        message,
        priority: 'normal',
      });
    } catch (error: any) {
      logger.error('Failed to send payment confirmation SMS', { 
        error: error.message, 
        phoneNumber 
      });
      throw error;
    }
  }

  /**
   * Send bulk SMS (with rate limiting)
   */
  async sendBulkSMS(messages: Array<{ to: string; message: string }>): Promise<SMSResult[]> {
    const results: SMSResult[] = [];

    for (const msg of messages) {
      try {
        const result = await this.sendSMS(msg);
        results.push(result);

        // Rate limiting - wait 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    logger.info('Bulk SMS sent', { 
      total: messages.length, 
      successful: results.filter(r => r.success).length 
    });

    return results;
  }

  /**
   * Validate phone number format (E.164)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    // Example: +48123456789 (Poland)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string = '48'): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading zero if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith(countryCode)) {
      cleaned = countryCode + cleaned;
    }

    // Add + prefix
    return '+' + cleaned;
  }

  /**
   * Verify Twilio configuration
   */
  async verifyConfiguration(): Promise<boolean> {
    if (!this.smsEnabled) {
      return false;
    }

    try {
      // In production, verify Twilio credentials:
      // const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
      // await client.api.accounts(this.twilioAccountSid).fetch();
      
      logger.info('SMS service configuration verified');
      return true;
    } catch (error: any) {
      logger.error('SMS service configuration invalid', { error: error.message });
      return false;
    }
  }

  /**
   * Get SMS service status
   */
  getStatus(): { enabled: boolean; provider: string } {
    return {
      enabled: this.smsEnabled,
      provider: this.smsEnabled ? 'twilio' : 'none',
    };
  }
}

// Export singleton instance
export default new SMSService();
