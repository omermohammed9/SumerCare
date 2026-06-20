import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { encryptionTransformer } from '../utils/encryptionTransformer';

@Entity()
export class Encounter {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    @Index()
    patientId!: string;

    @Column()
    @Index()
    providerId!: string;

    @Column()
    @Index()
    appointmentId!: string;

    @Column({ transformer: encryptionTransformer, type: 'text' })
    diagnosis!: string;

    @Column({ transformer: encryptionTransformer, type: 'text', nullable: true })
    notes!: string;

    @Column({ default: 'DRAFT' })
    status!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
