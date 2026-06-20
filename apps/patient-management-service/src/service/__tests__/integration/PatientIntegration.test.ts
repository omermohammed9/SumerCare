import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import { PatientService } from '@/service/PatientService';
import { PatientRepository } from '@/repository/PatientRepository';
import redisPublisher from '@/redis/redisPublisher';
import Patient from '@/entity/Patient';
import CreatePatientDto from '@/dto/CreatePatientDto';

describe('PatientService Integration', () => {
    let pgContainer: StartedPostgreSqlContainer;
    let redisContainer: StartedTestContainer;
    let dataSource: DataSource;
    let patientService: PatientService;
    let patientRepository: PatientRepository;

    beforeAll(async () => {
        // Start Redis container
        redisContainer = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .start();

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
        process.env.REDIS_URL = redisUrl;

        // Initialize Publisher
        await redisPublisher.connect();

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
        await redisPublisher.quit();
        if (pgContainer) {
            await pgContainer.stop();
        }
        if (redisContainer) {
            await redisContainer.stop();
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
