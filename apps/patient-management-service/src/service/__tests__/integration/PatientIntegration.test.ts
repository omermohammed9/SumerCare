import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { PatientService } from '@/service/PatientService';
import { PatientRepository } from '@/repository/PatientRepository';
import Patient from '@/entity/Patient';
import CreatePatientDto from '@/dto/CreatePatientDto';

jest.mock('@/redis/redisPublisher', () => ({
    xadd: jest.fn().mockResolvedValue('msg-id'),
    quit: jest.fn().mockResolvedValue('OK')
}));

describe('PatientService Integration', () => {
    let pgContainer: StartedPostgreSqlContainer;
    let dataSource: DataSource;
    let patientService: PatientService;
    let patientRepository: PatientRepository;

    beforeAll(async () => {
        // Start Postgres container
        pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
            .withDatabase('patient_test_db')
            .withUsername('test_user')
            .withPassword('test_pass')
            .start();

        const host = pgContainer.getHost();
        const port = pgContainer.getMappedPort(5432);

        dataSource = new DataSource({
            type: 'postgres',
            host: host,
            port: port,
            username: 'test_user',
            password: 'test_pass',
            database: 'patient_test_db',
            entities: [Patient],
            synchronize: true, // Auto-create schema for tests
            logging: false,
        });

        await dataSource.initialize();
        patientRepository = new PatientRepository(dataSource);
        patientService = new PatientService(patientRepository);
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        if (pgContainer) {
            await pgContainer.stop();
        }
    });

    it('should create a patient and publish an event', async () => {
        const dto: CreatePatientDto = {
            name: 'John Doe',
            gender: 'Male',
            dateOfBirth: new Date('1990-01-01'),
            nationalId: '123456789012'
        };

        const createdPatient = await patientService.createPatient(dto);

        expect(createdPatient).toBeDefined();
        expect(createdPatient.id).toBeDefined();
        expect(createdPatient.name).toBe('John Doe');
        
        // Verify it was saved to the real DB
        const savedPatient = await dataSource.getRepository(Patient).findOneBy({ id: createdPatient.id });
        expect(savedPatient).toBeDefined();
        expect(savedPatient?.nationalId).toBe('123456789012');
    });

});
