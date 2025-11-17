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

export enum ExpenseCategory {
  OFFICE_SUPPLIES = 'office_supplies',
  UTILITIES = 'utilities',
  RENT = 'rent',
  TRANSPORTATION = 'transportation',
  MEALS = 'meals',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  MARKETING = 'marketing',
  PROFESSIONAL_SERVICES = 'professional_services',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  OTHER = 'other',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('expenses')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'category'])
@Index(['expenseDate'])
export class Expense {
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
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100, nullable: true })
  expenseNumber: string;

  @Column({ length: 255 })
  description: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category: ExpenseCategory;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.DRAFT,
  })
  status: ExpenseStatus;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  grossAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vatRate: number;

  @Column({ type: 'varchar', length: 3, default: 'PLN' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  receiptUrl: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurringPattern: string;

  @Column({ type: 'jsonb', nullable: true })
  ocrData: {
    vendor?: string;
    amount?: number;
    date?: string;
    invoiceNumber?: string;
    vatNumber?: string;
    confidence?: number;
    rawText?: string;
  };

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
