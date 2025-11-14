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
import { InvoiceItem } from './InvoiceItem';

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
@Index(['tenantId', 'name'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 100, comment: 'Stock Keeping Unit' })
  sku: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'PLN' })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 23.0, comment: 'VAT rate %' })
  vatRate: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @Column({ length: 100, nullable: true, unique: false, comment: 'External system product ID (e.g., Allegro offer ID)' })
  externalProductId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Unit price in original currency' })
  unitPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InvoiceItem, (item) => item.product)
  invoiceItems: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
