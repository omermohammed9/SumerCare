import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { encryptionTransformer } from '../utils/encryptionTransformer';

export enum ProviderAvailability {
    AVAILABLE = 'AVAILABLE',
    UNAVAILABLE = 'UNAVAILABLE',
    ON_LEAVE = 'ON_LEAVE'
}

@Entity()
export class Provider {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ transformer: encryptionTransformer })
    firstName: string;

    @Column({ transformer: encryptionTransformer })
    lastName: string;

    @Column()
    @Index()
    specialty: string;

    @Column({ unique: true })
    licenseNumber: string;

    @Column({ transformer: encryptionTransformer })
    email: string;

    @Column({ nullable: true, transformer: encryptionTransformer })
    phone: string;

    @Column({
        type: 'enum',
        enum: ProviderAvailability,
        default: ProviderAvailability.AVAILABLE
    })
    availability: ProviderAvailability;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
