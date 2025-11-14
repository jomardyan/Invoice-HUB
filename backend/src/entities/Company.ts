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

@Entity('companies')
@Index(['tenantId', 'nip'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.companies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 13, comment: 'Polish Tax ID (NIP)' })
  nip: string;

  @Column({ length: 50, nullable: true, comment: 'VAT-EU Number' })
  vatEu: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 10, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 2, default: 'PL' })
  country: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  bankName: string;

  @Column({ length: 34, nullable: true, comment: 'IBAN format' })
  bankAccount: string;

  @Column({ length: 11, nullable: true })
  swift: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultInvoiceSettings: {
    paymentTermDays?: number;
    defaultCurrency?: string;
    taxRate?: number;
    invoicePrefix?: string;
    invoiceNumberFormat?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Invoice, (invoice) => invoice.company)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
