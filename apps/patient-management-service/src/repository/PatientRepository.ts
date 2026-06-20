/**
 * @file PatientRepository.ts
 * @description Repository class for managing Patient entity data access in PostgreSQL via TypeORM.
 * Abstracts the database queries and ensures data validation (like checking for invalid IDs).
 * @dependencies TypeORM, CustomErrors
 */
import { DataSource, FindOptionsWhere } from 'typeorm';
import  Patient  from '@/entity/Patient';
import CreatePatientDto from "@/dto/CreatePatientDto";
import UpdatePatientDto from "@/dto/UpdatePatientDto";
import { BadRequestError, NotFoundError } from '@/utils/CustomErrors';
import { IPatientRepository } from '@/repository/IPatientRepository';

export class PatientRepository implements IPatientRepository {
    private repository;
    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(Patient);
    }

    async find(): Promise<Patient[]> {
        console.log('Repository: Finding all patients');
        const patients = this.repository.find();
        console.log(`Repository: Found ${(await patients).length} patients`);
        return patients;
    }

    create(patientData: CreatePatientDto): Patient {
        return this.repository.create(patientData);
    }

    async save(patient: Patient): Promise<Patient> {
        return this.repository.save(patient);
    }

    async findOneBy(criteria: Partial<Patient>): Promise<Patient | null> {
        console.log(`ID in findOneBy: ${criteria.id}, Type: ${typeof criteria.id}`);
        if ('id' in criteria && typeof criteria.id !== 'number') {
            throw new BadRequestError('Invalid ID provided');
        }
        return this.repository.findOneBy(criteria as FindOptionsWhere<Patient>);
    }


    async update(id: number, patientData: UpdatePatientDto): Promise<Patient | null> {
        const updateResult = await this.repository.update(id, patientData);
        if (updateResult.affected && updateResult.affected > 0) {
            return this.repository.findOneBy({id});
        }
        return null;
    }
    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundError('No patient found with the given ID.');
        }
    }
}
