import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';
import { Company } from './Company';
import { Customer } from './Customer';

export enum ReceiptType {
  STANDARD = 'standard',
  E_RECEIPT = 'e_receipt',
  FISCAL = 'fiscal',
}

export enum ReceiptStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  CANCELLED = 'cancelled',
}

@Entity('receipts')
@Index(['tenantId', 'receiptNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['issueDate'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100, unique: true })
  receiptNumber: string;

  @Column({
    type: 'enum',
    enum: ReceiptType,
    default: ReceiptType.STANDARD,
  })
  receiptType: ReceiptType;

  @Column({
    type: 'enum',
    enum: ReceiptStatus,
    default: ReceiptStatus.DRAFT,
  })
  status: ReceiptStatus;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  grossAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'PLN' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fiscalPrinterNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCode: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
