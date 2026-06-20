import {Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index} from 'typeorm';
import {encryptionTransformer} from '@/utils/EncryptionTransformer';

@Entity()
class Patient extends BaseEntity{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({type: 'varchar', nullable: true})
    gender!: string;

    @Column()
    dateOfBirth!: Date;

    @Column({ nullable: true })
    phoneNumber!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ nullable: true })
    address!: string;

    @Column({ nullable: true })
    emergencyContactName!: string;

    @Column({ nullable: true })
    emergencyContactPhone!: string;

    @Column({ nullable: true })
    bloodType!: string;

    @Column({ nullable: true, type: 'simple-array' })
    allergies!: string[];

    @Column({ nullable: true })
    medicalConditions!: string;

    @Index()
    @Column({ unique: true, nullable: true, transformer: encryptionTransformer })
    nationalId!: string;

    @Column({ type: 'jsonb', nullable: true })
    wearableTelemetry!: any;


    @CreateDateColumn()
    createdDate!: Date;

    @UpdateDateColumn()
    lastUpdated!: Date;

}
export default Patient;