import { PatientService } from '@/service/PatientService';
import { PatientRepository } from '@/repository/PatientRepository';
import redisPublisher from '@/redis/redisPublisher';
import { NotFoundError, ConflictError } from '@/utils/CustomErrors';

jest.mock('@/repository/PatientRepository');
jest.mock('@/redis/redisPublisher', () => ({
    xadd: jest.fn().mockResolvedValue('msg-id')
}));
jest.mock('@/winston/WinstonLogger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));
jest.mock('@/metrics/metricsService', () => ({
    dbQueryDurationMicroseconds: { startTimer: jest.fn(() => jest.fn()) },
    redisPublishDurationMicroseconds: { startTimer: jest.fn(() => jest.fn()) }
}));
jest.mock('@/utils/circuitBreaker', () => ({
    createCircuitBreaker: jest.fn((action) => ({
        fire: jest.fn(() => action())
    }))
}));

describe('PatientService', () => {
    let patientService: PatientService;
    let mockPatientRepository: jest.Mocked<PatientRepository>;

    beforeEach(() => {
        mockPatientRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
        } as any;
        patientService = new PatientService(mockPatientRepository);
        jest.clearAllMocks();
    });

    describe('createPatient', () => {
        it('should create a patient and publish an event', async () => {
            const patientData = { name: 'Omar', dateOfBirth: '1990-01-01', nationalId: '123456789012' } as any;
            const savedPatient = { id: 1, ...patientData };
            
            mockPatientRepository.create.mockReturnValue(savedPatient);
            mockPatientRepository.save.mockResolvedValue(savedPatient);

            const result = await patientService.createPatient(patientData);

            expect(result).toEqual(savedPatient);
            expect(mockPatientRepository.save).toHaveBeenCalledWith(savedPatient);
            expect(redisPublisher.xadd).toHaveBeenCalledWith(
                'patient_events',
                '*',
                'message',
                expect.stringContaining('patient.upserted')
            );
        });
        
        it('should throw ConflictError on duplicate national ID', async () => {
            const error = new Error('Duplicate');
            (error as any).code = '23505';
            mockPatientRepository.save.mockRejectedValue(error);
            
            await expect(patientService.createPatient({} as any)).rejects.toThrow(ConflictError);
        });
    });

    describe('getPatientById', () => {
        it('should return a patient if found', async () => {
            const patient = { id: 1, name: 'Omar' };
            mockPatientRepository.findOneBy.mockResolvedValue(patient as any);
            const result = await patientService.getPatientById(1);
            expect(result).toEqual(patient);
        });
    });

    describe('updatePatient', () => {
        it('should update a patient and publish event', async () => {
            const patient = { id: 1, name: 'Omar' };
            mockPatientRepository.findOneBy.mockResolvedValue(patient as any);
            mockPatientRepository.save.mockResolvedValue({ ...patient, name: 'Ali' } as any);

            const result = await patientService.updatePatient(1, { name: 'Ali' } as any);
            expect(result.name).toBe('Ali');
            expect(redisPublisher.xadd).toHaveBeenCalledWith(
                'patient_events',
                '*',
                'message',
                expect.stringContaining('patient.upserted')
            );
        });

        it('should throw NotFoundError if patient does not exist', async () => {
            mockPatientRepository.findOneBy.mockResolvedValue(null);
            await expect(patientService.updatePatient(1, {} as any)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deletePatient', () => {
        it('should delete a patient and publish event', async () => {
            mockPatientRepository.findOneBy.mockResolvedValue({ id: 1, name: 'Omar' } as any);
            mockPatientRepository.delete.mockResolvedValue({} as any);

            await patientService.deletePatient(1);
            expect(mockPatientRepository.delete).toHaveBeenCalledWith(1);
            expect(redisPublisher.xadd).toHaveBeenCalledWith(
                'patient_events',
                '*',
                'message',
                expect.stringContaining('patient.deleted')
            );
        });
    });
});
