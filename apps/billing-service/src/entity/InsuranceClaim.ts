import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ClaimStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DENIED = 'DENIED'
}

@Entity()
export class InsuranceClaim {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    patientId: string;

    @Column()
    @Index()
    invoiceId: string;

    @Column('decimal', { precision: 10, scale: 2 })
    claimAmount: number;

    @Column({
        type: 'enum',
        enum: ClaimStatus,
        default: ClaimStatus.PENDING
    })
    status: ClaimStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
