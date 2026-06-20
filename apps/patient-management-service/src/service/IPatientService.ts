import Patient from '@/entity/Patient';
import CreatePatientDto from '@/dto/CreatePatientDto';
import UpdatePatientDto from '@/dto/UpdatePatientDto';

export interface IPatientService {
    createPatient(patientData: CreatePatientDto): Promise<Patient>;
    getPatientById(id: number): Promise<Patient | null>;
    getAllPatients(): Promise<Patient[]>;
    updatePatient(id: number, patientData: UpdatePatientDto): Promise<Patient>;
    deletePatient(id: number): Promise<void>;
}
