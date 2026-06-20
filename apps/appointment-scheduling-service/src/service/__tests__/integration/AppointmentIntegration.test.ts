import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import AppointmentService from '@/service/AppointmentService';
import AppointmentRepository from '@/repository/AppointmentRepository';
import { PatientCache } from '@/entity/PatientCache';
import { Appointment } from '@/entity/Appointment';
import AppDataSource from '@/database/database';
import CreateAppointmentDTO from '@/dto/CreateAppointmentDTO';
import Redis from 'ioredis';

describe('AppointmentService Integration', () => {
    let pgContainer: StartedPostgreSqlContainer;
    let redisContainer: StartedTestContainer;
    let dataSource: DataSource;
    let appointmentService: AppointmentService;
    let appointmentRepository: AppointmentRepository;
    let testRedisPublisher: Redis;

    beforeAll(async () => {
        // Start Redis container
        redisContainer = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .start();

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
        process.env.REDIS_URL = redisUrl;

        // Initialize Publisher for testing
        testRedisPublisher = new Redis(redisUrl);

        // Start Postgres container
        pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
            .withDatabase('appointment_test_db')
            .withUsername('test_user')
            .withPassword('test_pass')
            .start();

        AppDataSource.setOptions({
            host: pgContainer.getHost(),
            port: pgContainer.getMappedPort(5432),
            username: 'test_user',
            password: 'test_pass',
            database: 'appointment_test_db',
            entities: [Appointment, PatientCache],
            synchronize: true,
            dropSchema: true
        });

        dataSource = AppDataSource;
        await dataSource.initialize();
        appointmentRepository = new AppointmentRepository(dataSource);
        appointmentService = new AppointmentService(appointmentRepository);

        // Start the subscriber to listen to events
        const { startEventSubscriber } = await import('@/database/subscriberService');
        await startEventSubscriber(dataSource);
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        const { default: redisSubscriber } = await import('@/redis/redisSubscriber');
        await redisSubscriber.quit();
        await testRedisPublisher.quit();
        if (pgContainer) {
            await pgContainer.stop();
        }
        if (redisContainer) {
            await redisContainer.stop();
        }
    });

    it('should process patient cache sync and schedule an appointment', async () => {
        // 1. Simulate a patient.upserted event via Redis
        const eventPayload = {
            event: 'patient.upserted',
            data: {
                id: 999,
                name: 'Integration Test Patient'
            }
        };

        // Use XADD since we migrated to Redis Streams
        const payload = JSON.stringify(eventPayload);
        await testRedisPublisher.xadd('patient_events', '*', 'message', payload);

        // Wait a brief moment for the subscriber to process the event
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Verify PatientCache was updated
        const cachedPatient = await dataSource.getRepository(PatientCache).findOneBy({ id: 999 });
        expect(cachedPatient).toBeDefined();
        expect(cachedPatient?.name).toBe('Integration Test Patient');

        // 3. Create an appointment for this patient
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
        
        const dto: Omit<CreateAppointmentDTO, 'id'> = {
            patientId: 999,
            date: futureDate,
            timezone: 'America/New_York',
            AppointmentTime: '10:00',
            duration: 60,
            doctorName: 'Dr. Smith'
        };

        const createdAppointment = await appointmentService.createAppointment(dto);

        expect(createdAppointment).toBeDefined();
        expect(createdAppointment.id).toBeDefined();
        expect(createdAppointment.patientId).toBe(999);
        expect(createdAppointment.doctorName).toBe('Dr. Smith');
        expect(createdAppointment.status).toBe('SCHEDULED');
    });

});
