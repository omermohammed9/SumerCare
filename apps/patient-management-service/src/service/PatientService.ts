import Patient from '@/entity/Patient';
import { PatientRepository } from '@/repository/PatientRepository';
import UpdatePatientDto from "@/dto/UpdatePatientDto";
import CreatePatientDto from "@/dto/CreatePatientDto";
import redisPublisher from '@/redis/redisPublisher';
import logger from '@/winston/WinstonLogger';
import { createCircuitBreaker } from '@/utils/circuitBreaker';
import { dbQueryDurationMicroseconds, redisPublishDurationMicroseconds } from '@/metrics/metricsService';
import { ConflictError, NotFoundError } from '@/utils/CustomErrors';
import { IPatientService } from '@/service/IPatientService';

export class PatientService implements IPatientService {
    private patientRepository: PatientRepository;

    constructor(patientRepository: PatientRepository) {
        this.patientRepository = patientRepository;
    }

    /**
     * Publishes a patient upsert event.
     * @param id Patient ID
     * @param name Patient Name
     */
    private publishUpsertEvent(id: number, name: string): void {
        const payload = JSON.stringify({ event: 'patient.upserted', data: { id, name } });
        
        const action = async () => redisPublisher.xadd('patient_events', '*', 'message', payload);
        const breaker = createCircuitBreaker(action, 'RedisPublishUpsert');
        
        const stopTimer = redisPublishDurationMicroseconds.startTimer({ event: 'patient.upserted' });
        breaker.fire()
            .then(() => {
                stopTimer();
                logger.info('[Redis Streams] Event published', { event: 'patient.upserted', patientId: id });
            })
            .catch((err: Error) => logger.error('[Redis Streams] Publish failed', { event: 'patient.upserted', patientId: id, error: err.message }));
    }

    /**
     * Publishes a patient delete event.
     * @param id Patient ID
     */
    private publishDeleteEvent(id: number): void {
        const payload = JSON.stringify({ event: 'patient.deleted', data: { id } });

        const action = async () => redisPublisher.xadd('patient_events', '*', 'message', payload);
        const breaker = createCircuitBreaker(action, 'RedisPublishDelete');
        
        const stopTimer = redisPublishDurationMicroseconds.startTimer({ event: 'patient.deleted' });
        breaker.fire()
            .then(() => {
                stopTimer();
                logger.info('[Redis Streams] Event published', { event: 'patient.deleted', patientId: id });
            })
            .catch((err: Error) => logger.error('[Redis Streams] Publish failed', { event: 'patient.deleted', patientId: id, error: err.message }));
    }

    /**
     * Creates a new patient and publishes a patient.upserted event.
     */
    async createPatient(patientData: CreatePatientDto): Promise<Patient> {
        try {
            const patient = this.patientRepository.create(patientData);
            
            const stopTimer = dbQueryDurationMicroseconds.startTimer({ operation: 'save' });
            const action = async () => this.patientRepository.save(patient);
            const breaker = createCircuitBreaker(action, 'DatabaseSavePatient');
            const savedPatient = await breaker.fire();
            stopTimer();
            logger.info('Patient created', { patientId: savedPatient.id, name: savedPatient.name });
            this.publishUpsertEvent(savedPatient.id, savedPatient.name);
            return savedPatient;
        } catch (error: unknown) {
            if (error instanceof Error && (error as any).code === '23505') {
                throw new ConflictError('A patient with this national ID already exists');
            }
            throw error;
        }
    }

    /**
     * Gets a patient by ID.
     */
    async getPatientById(id: number): Promise<Patient | null> {
        const stopTimer = dbQueryDurationMicroseconds.startTimer({ operation: 'findOneBy' });
        const action = async () => this.patientRepository.findOneBy({ id });
        const breaker = createCircuitBreaker(action, 'DatabaseFindPatient');
        const result = await breaker.fire();
        stopTimer();
        return result;
    }

    /**
     * Gets all patients.
     */
    async getAllPatients(): Promise<Patient[]> {
        logger.info('Fetching all patients from the database');
        const stopTimer = dbQueryDurationMicroseconds.startTimer({ operation: 'find' });
        const action = async () => this.patientRepository.find();
        const breaker = createCircuitBreaker(action, 'DatabaseFindAllPatients');
        const patients = await breaker.fire();
        stopTimer();
        logger.info(`Retrieved ${patients.length} patients`);
        return patients;
    }

    /**
     * Updates an existing patient and publishes a patient.upserted event.
     */
    async updatePatient(id: number, patientData: UpdatePatientDto): Promise<Patient> {
        const stopTimerFind = dbQueryDurationMicroseconds.startTimer({ operation: 'findOneBy' });
        const actionFind = async () => this.patientRepository.findOneBy({ id });
        const breakerFind = createCircuitBreaker(actionFind, 'DatabaseFindPatient');
        const patient = await breakerFind.fire();
        stopTimerFind();

        if (!patient) {
            throw new NotFoundError('Patient not found');
        }
        Object.assign(patient, patientData);
        try {
            const stopTimerSave = dbQueryDurationMicroseconds.startTimer({ operation: 'save' });
            const actionSave = async () => this.patientRepository.save(patient);
            const breakerSave = createCircuitBreaker(actionSave, 'DatabaseSavePatient');
            const updatedPatient = await breakerSave.fire();
            stopTimerSave();
            logger.info('Patient updated', { patientId: updatedPatient.id });
            this.publishUpsertEvent(updatedPatient.id, updatedPatient.name);
            return updatedPatient;
        } catch (error: unknown) {
            if (error instanceof Error && (error as any).code === '23505') {
                throw new ConflictError('A patient with this national ID already exists');
            }
            throw error;
        }
    }

    /**
     * Deletes a patient and publishes a patient.deleted event.
     */
    async deletePatient(id: number): Promise<void> {
        const stopTimerFind = dbQueryDurationMicroseconds.startTimer({ operation: 'findOneBy' });
        const actionFind = async () => this.patientRepository.findOneBy({ id });
        const breakerFind = createCircuitBreaker(actionFind, 'DatabaseFindPatient');
        const patient = await breakerFind.fire();
        stopTimerFind();

        if (!patient) {
            throw new NotFoundError('Patient not found');
        }
        
        const stopTimerDelete = dbQueryDurationMicroseconds.startTimer({ operation: 'delete' });
        const actionDelete = async () => this.patientRepository.delete(id);
        const breakerDelete = createCircuitBreaker(actionDelete, 'DatabaseDeletePatient');
        await breakerDelete.fire();
        stopTimerDelete();
        logger.info('Patient deleted', { patientId: id });
        this.publishDeleteEvent(id);
    }
}

