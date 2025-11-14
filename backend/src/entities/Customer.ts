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
import { Invoice } from './Invoice';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

@Entity('customers')
@Index(['tenantId', 'email'])
@Index(['tenantId', 'nip'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.INDIVIDUAL,
  })
  type: CustomerType;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 13, nullable: true, comment: 'Polish Tax ID (NIP)' })
  nip: string;

  @Column({ length: 50, nullable: true, comment: 'VAT-EU Number' })
  vatEu: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ length: 10, nullable: true })
  billingPostalCode: string;

  @Column({ length: 100, nullable: true })
  billingCity: string;

  @Column({ length: 2, default: 'PL' })
  billingCountry: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ length: 10, nullable: true })
  shippingPostalCode: string;

  @Column({ length: 100, nullable: true })
  shippingCity: string;

  @Column({ length: 2, nullable: true })
  shippingCountry: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @Column({ length: 100, nullable: true, unique: false, comment: 'External system ID (e.g., Allegro buyer login)' })
  externalOrderId: string;

  @Column({ type: 'int', default: 30, comment: 'Payment terms in days' })
  paymentTermDays: number;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    preferredLanguage?: string;
    preferredCurrency?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
