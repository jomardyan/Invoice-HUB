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

export enum WarehouseType {
  MAIN = 'main',
  BRANCH = 'branch',
  VIRTUAL = 'virtual',
  CONSIGNMENT = 'consignment',
}

@Entity('warehouses')
@Index(['tenantId', 'code'], { unique: true })
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: WarehouseType,
    default: WarehouseType.MAIN,
  })
  type: WarehouseType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'uuid', nullable: true })
  managerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('warehouse_stock')
@Index(['warehouseId', 'productId'], { unique: true })
export class WarehouseStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  minStockLevel: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  maxStockLevel: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'date', nullable: true })
  lastStockCheck: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
