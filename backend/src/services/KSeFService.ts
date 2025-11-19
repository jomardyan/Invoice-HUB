import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import {
  KSeFSubmission,
  KSeFConfiguration,
  KSeFStatus,
} from '../entities/KSeFIntegration';
import { Invoice } from '../entities/Invoice';
import { AppDataSource } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class KSeFService {
  private submissionRepository: Repository<KSeFSubmission>;
  private configRepository: Repository<KSeFConfiguration>;
  private invoiceRepository: Repository<Invoice>;
  private ksefClient: AxiosInstance;

  constructor() {
    this.submissionRepository = AppDataSource.getRepository(KSeFSubmission);
    this.configRepository = AppDataSource.getRepository(KSeFConfiguration);
    this.invoiceRepository = AppDataSource.getRepository(Invoice);

    // Initialize KSeF API client
    this.ksefClient = axios.create({
      baseURL: process.env.KSEF_API_URL || 'https://ksef.mf.gov.pl/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createConfiguration(data: {
    tenantId: string;
    nip: string;
    token: string;
    isEnabled?: boolean;
    autoSubmit?: boolean;
    environment?: string;
    settings?: {
      testMode?: boolean;
      emailNotifications?: boolean;
      autoRetry?: boolean;
      maxRetries?: number;
    };
  }): Promise<KSeFConfiguration> {
    // Check if configuration already exists
    const existing = await this.configRepository.findOne({
      where: { tenantId: data.tenantId },
    });

    if (existing) {
      throw new AppError('KSeF configuration already exists for this tenant', 409);
    }

    // Encrypt token before storing
    const encryptedToken = this.encryptToken(data.token);

    const config = this.configRepository.create({
      tenantId: data.tenantId,
      nip: data.nip,
      encryptedToken,
      isEnabled: data.isEnabled ?? false,
      autoSubmit: data.autoSubmit ?? false,
      environment: data.environment || 'production',
      settings: data.settings || {
        testMode: false,
        emailNotifications: true,
        autoRetry: true,
        maxRetries: 3,
      },
    });

    return await this.configRepository.save(config);
  }

  async getConfiguration(tenantId: string): Promise<KSeFConfiguration> {
    const config = await this.configRepository.findOne({
      where: { tenantId },
    });

    if (!config) {
      throw new AppError('KSeF configuration not found', 404);
    }

    return config;
  }

  async updateConfiguration(
    tenantId: string,
    data: Partial<KSeFConfiguration>
  ): Promise<KSeFConfiguration> {
    const config = await this.getConfiguration(tenantId);

    // If token is being updated, encrypt it
    if (data.encryptedToken) {
      data.encryptedToken = this.encryptToken(data.encryptedToken);
    }

    Object.assign(config, data);
    return await this.configRepository.save(config);
  }

  async deleteConfiguration(tenantId: string): Promise<void> {
    const config = await this.getConfiguration(tenantId);
    await this.configRepository.remove(config);
  }

  async submitInvoice(
    invoiceId: string,
    tenantId: string
  ): Promise<KSeFSubmission> {
    // Get configuration
    const config = await this.getConfiguration(tenantId);

    if (!config.isEnabled) {
      throw new AppError('KSeF integration is not enabled', 400);
    }

    // Get invoice
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, tenantId },
      relations: ['company', 'customer', 'items'],
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Check if already submitted
    const existing = await this.submissionRepository.findOne({
      where: { invoiceId, tenantId },
    });

    if (existing && existing.status === KSeFStatus.ACCEPTED) {
      throw new AppError('Invoice already submitted and accepted in KSeF', 400);
    }

    // Generate FA_VAT XML
    const submissionXml = this.generateFAVATXml(invoice);

    // Create or update submission record
    let submission: KSeFSubmission;
    if (existing) {
      existing.status = KSeFStatus.PENDING;
      existing.submissionXml = submissionXml;
      existing.retryCount = (existing.retryCount || 0) + 1;
      existing.lastRetryAt = new Date();
      submission = await this.submissionRepository.save(existing);
    } else {
      submission = this.submissionRepository.create({
        tenantId,
        invoiceId,
        status: KSeFStatus.PENDING,
        submissionXml,
        retryCount: 0,
      });
      submission = await this.submissionRepository.save(submission);
    }

    // Submit to KSeF API (async)
    this.performSubmission(submission.id, config).catch((error) => {
      console.error('KSeF submission error:', error);
    });

    return submission;
  }

  private async performSubmission(
    submissionId: string,
    config: KSeFConfiguration
  ): Promise<void> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Decrypt token
      const token = this.decryptToken(config.encryptedToken || '');

      // Submit to KSeF
      const response = await this.ksefClient.post(
        '/online/Invoice/Send',
        {
          invoiceHash: {
            hashSHA256: this.calculateHash(submission.submissionXml || ''),
            fileSize: Buffer.byteLength(submission.submissionXml || '', 'utf8'),
          },
          invoicePayload: {
            type: 'plain',
            invoiceBody: Buffer.from(submission.submissionXml || '').toString('base64'),
          },
        },
        {
          headers: {
            SessionToken: token,
          },
        }
      );

      // Update submission with response
      submission.status = KSeFStatus.SUBMITTED;
      submission.submittedAt = new Date();
      submission.ksefReferenceNumber = response.data.referenceNumber;
      submission.ksefResponse = {
        processingCode: response.data.processingCode,
        processingDescription: response.data.processingDescription,
        timestamp: response.data.timestamp,
      };

      await this.submissionRepository.save(submission);

      // Poll for acceptance
      setTimeout(() => {
        this.checkSubmissionStatus(submissionId, config).catch(console.error);
      }, 5000);
    } catch (error: any) {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (submission) {
        submission.status = KSeFStatus.ERROR;
        submission.errorMessage = error.message || 'Unknown error';
        await this.submissionRepository.save(submission);
      }
    }
  }

  private async checkSubmissionStatus(
    submissionId: string,
    config: KSeFConfiguration
  ): Promise<void> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (!submission || !submission.ksefReferenceNumber) {
        return;
      }

      const token = this.decryptToken(config.encryptedToken || '');

      const response = await this.ksefClient.get(
        `/online/Invoice/Status/${submission.ksefReferenceNumber}`,
        {
          headers: {
            SessionToken: token,
          },
        }
      );

      if (response.data.processingCode === 200) {
        submission.status = KSeFStatus.ACCEPTED;
        submission.acceptedAt = new Date();
        await this.submissionRepository.save(submission);
      } else if (response.data.processingCode >= 400) {
        submission.status = KSeFStatus.REJECTED;
        submission.errorMessage = response.data.processingDescription;
        await this.submissionRepository.save(submission);
      }
    } catch (error) {
      console.error('Error checking KSeF status:', error);
    }
  }

  async getSubmission(id: string, tenantId: string): Promise<KSeFSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id, tenantId },
      relations: ['invoice'],
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    return submission;
  }

  async getSubmissions(
    tenantId: string,
    filters?: {
      status?: KSeFStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ submissions: KSeFSubmission[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('submission.invoice', 'invoice');

    if (filters?.status) {
      query.andWhere('submission.status = :status', { status: filters.status });
    }

    const [submissions, total] = await query
      .orderBy('submission.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { submissions, total };
  }

  private generateFAVATXml(invoice: any): string {
    // This is a simplified FA_VAT XML generation
    // In production, use a proper XML library like xml2js or xmlbuilder2
    return `<?xml version="1.0" encoding="UTF-8"?>
<Faktura xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/">
  <Naglowek>
    <KodFormularza kodSystemowy="FA(2)" wersjaSchemy="1-0E">FA</KodFormularza>
    <WariantFormularza>2</WariantFormularza>
    <DataWytworzeniaFa>${new Date().toISOString()}</DataWytworzeniaFa>
    <SystemInfo>Invoice-HUB v1.0</SystemInfo>
  </Naglowek>
  <Podmiot1>
    <DaneIdentyfikacyjne>
      <NIP>${invoice.company?.nip || ''}</NIP>
      <Nazwa>${invoice.company?.name || ''}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <KodKraju>PL</KodKraju>
      <AdresL1>${invoice.company?.address || ''}</AdresL1>
      <AdresL2>${invoice.company?.city || ''} ${invoice.company?.postalCode || ''}</AdresL2>
    </Adres>
  </Podmiot1>
  <Fa>
    <P_1>${invoice.issueDate}</P_1>
    <P_2A>${invoice.invoiceNumber}</P_2A>
    <P_13_1>${invoice.netAmount || 0}</P_13_1>
    <P_14_1>${invoice.vatAmount || 0}</P_14_1>
    <P_15>${invoice.total || 0}</P_15>
  </Fa>
</Faktura>`;
  }

  private calculateHash(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private encryptToken(token: string): string {
    // In production, use proper encryption (AES-256)
    // For now, just Base64 encode (NOT SECURE - implement proper encryption)
    return Buffer.from(token).toString('base64');
  }

  private decryptToken(encryptedToken: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedToken, 'base64').toString('utf-8');
  }

  async getStats(
    tenantId: string
  ): Promise<{
    totalSubmissions: number;
    pending: number;
    submitted: number;
    accepted: number;
    rejected: number;
    errors: number;
  }> {
    const submissions = await this.submissionRepository.find({
      where: { tenantId },
    });

    return {
      totalSubmissions: submissions.length,
      pending: submissions.filter((s) => s.status === KSeFStatus.PENDING).length,
      submitted: submissions.filter((s) => s.status === KSeFStatus.SUBMITTED)
        .length,
      accepted: submissions.filter((s) => s.status === KSeFStatus.ACCEPTED).length,
      rejected: submissions.filter((s) => s.status === KSeFStatus.REJECTED).length,
      errors: submissions.filter((s) => s.status === KSeFStatus.ERROR).length,
    };
  }

  async listActiveSessions(tenantId: string, options: any): Promise<any> {
    console.log(tenantId, options);
    return { sessions: [], total: 0 };
  }

  async terminateCurrentSession(tenantId: string): Promise<void> {
    console.log(tenantId);
    // Stub
  }

  async terminateSession(tenantId: string, referenceNumber: string): Promise<void> {
    console.log(tenantId, referenceNumber);
    // Stub
  }

  async sendInteractiveInvoice(tenantId: string, invoice: any): Promise<any> {
    console.log(tenantId, invoice);
    return { referenceNumber: 'stub', status: 'stub' };
  }

  async getSessionStatus(tenantId: string, referenceNumber: string): Promise<any> {
    console.log(tenantId, referenceNumber);
    return { status: 'stub' };
  }

  async getSessionUPO(tenantId: string, referenceNumber: string): Promise<any> {
    console.log(tenantId, referenceNumber);
    return { upo: 'stub' };
  }

  async openBatchSession(tenantId: string, options: any): Promise<any> {
    console.log(tenantId, options);
    return { referenceNumber: 'stub' };
  }

  async closeBatchSession(tenantId: string, referenceNumber: string): Promise<any> {
    console.log(tenantId, referenceNumber);
    return { status: 'closed' };
  }

  async uploadBatchInvoice(tenantId: string, referenceNumber: string, invoiceData: any): Promise<any> {
    console.log(tenantId, referenceNumber, invoiceData);
    return { status: 'uploaded' };
  }

  async queryInvoiceMetadata(tenantId: string, criteria: any, pagination: any): Promise<any> {
    console.log(tenantId, criteria, pagination);
    return { invoices: [], total: 0 };
  }

  async getInvoiceByKsefNumber(tenantId: string, ksefNumber: string): Promise<any> {
    console.log(tenantId, ksefNumber);
    return { invoice: {} };
  }

  async createInvoiceExport(tenantId: string, criteria: any, encryptionKey: any): Promise<any> {
    console.log(tenantId, criteria, encryptionKey);
    return { exportId: 'stub' };
  }

  async getExportStatus(tenantId: string, exportId: string): Promise<any> {
    console.log(tenantId, exportId);
    return { status: 'stub' };
  }
}
