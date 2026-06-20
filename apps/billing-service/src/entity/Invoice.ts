import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum InvoiceStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED'
}

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    @Index()
    patientId!: string;

    @Column()
    @Index()
    encounterId!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount!: number;

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.PENDING
    })
    status!: InvoiceStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
