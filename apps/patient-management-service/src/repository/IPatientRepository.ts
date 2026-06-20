import Patient from '@/entity/Patient';
import CreatePatientDto from '@/dto/CreatePatientDto';

export interface IPatientRepository {
    create(patientData: CreatePatientDto): Patient;
    save(patient: Patient): Promise<Patient>;
    findOneBy(criteria: Partial<Patient>): Promise<Patient | null>;
    find(): Promise<Patient[]>;
    delete(id: number): Promise<void>;
}
