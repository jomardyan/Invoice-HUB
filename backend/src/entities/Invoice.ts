import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';
import { Company } from './Company';
import { Customer } from './Customer';
import { InvoiceItem } from './InvoiceItem';

export enum InvoiceType {
  STANDARD = 'standard',
  PROFORMA = 'proforma',
  CREDIT_NOTE = 'credit_note',
  CORRECTION = 'correction',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  CORRECTED = 'corrected',
}

@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'customerId'])
@Index(['issueDate'])
@Index(['dueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.invoices)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.invoices)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.invoices)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

  @Column({ length: 20, nullable: true })
  series: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.STANDARD,
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  saleDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'int', default: 30 })
  paymentTermDays: number;

  @Column({ length: 3, default: 'PLN' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @Column({ type: 'uuid', nullable: true })
  originalInvoiceId: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ length: 100, nullable: true, unique: false, comment: 'External system order ID (e.g., Allegro order ID)' })
  externalOrderId: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
