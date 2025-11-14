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

@Entity('allegro_integrations')
@Index(['tenantId', 'userId'])
export class AllegroIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.allegroIntegrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100, unique: true })
  allegroUserId: string;

  @Column({ type: 'text', comment: 'Encrypted access token' })
  accessToken: string;

  @Column({ type: 'text', comment: 'Encrypted refresh token' })
  refreshToken: string;

  @Column({ type: 'timestamp' })
  tokenExpiresAt: Date;

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
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
