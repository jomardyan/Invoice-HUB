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
import { Invoice } from './Invoice';

export enum KSeFStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ERROR = 'error',
}

@Entity('ksef_submissions')
@Index(['tenantId', 'invoiceId'])
@Index(['ksefReferenceNumber'], { unique: true, where: 'ksefReferenceNumber IS NOT NULL' })
export class KSeFSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ksefReferenceNumber: string;

  @Column({
    type: 'enum',
    enum: KSeFStatus,
    default: KSeFStatus.PENDING,
  })
  status: KSeFStatus;

  @Column({ type: 'text', nullable: true })
  submissionXml: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  ksefResponse: {
    processingCode?: string;
    processingDescription?: string;
    timestamp?: string;
    warnings?: Array<string>;
  };

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ksef_configurations')
@Index(['tenantId'], { unique: true })
export class KSeFConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  nip: string;

  @Column({ type: 'text', nullable: true })
  encryptedToken: string;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  autoSubmit: boolean;

  @Column({ type: 'varchar', length: 100, default: 'production' })
  environment: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    testMode?: boolean;
    emailNotifications?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
