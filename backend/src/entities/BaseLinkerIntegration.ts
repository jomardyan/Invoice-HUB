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

@Entity('baselinker_integrations')
@Index(['tenantId', 'userId'])
export class BaseLinkerIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255, unique: true })
  apiToken: string; // Encrypted API token

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'int', default: 0 })
  syncErrorCount: number;

  @Column({ type: 'text', nullable: true })
  lastSyncError: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    autoGenerateInvoices?: boolean;
    invoiceTemplateId?: string;
    syncFrequencyMinutes?: number;
    autoMarkAsPaid?: boolean;
    autoCreateCustomer?: boolean;
    autoCreateProduct?: boolean;
    defaultVatRate?: number;
    orderSources?: number[]; // Filter by specific order sources
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
