import request from 'supertest';
import app from '@/server';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import AppDataSource, { initializeDataSource } from '@/Database/database';

jest.mock('@/redis/redisPublisher', () => ({
    xadd: jest.fn().mockResolvedValue('msg-id'),
    quit: jest.fn().mockResolvedValue('OK')
}));

let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
    // Start Postgres test container
    postgresContainer = await new PostgreSqlContainer('postgres:16-alpine').start();

    // Override envs before DB init
    process.env.DB_HOST = postgresContainer.getHost();
    process.env.DB_PORT = postgresContainer.getPort().toString();
    process.env.DB_USERNAME = postgresContainer.getUsername();
    process.env.DB_PASSWORD = postgresContainer.getPassword();
    process.env.DB_DATABASE = postgresContainer.getDatabase();
    process.env.NODE_ENV = 'test';

    await initializeDataSource();
}, 60000);

afterAll(async () => {
    await AppDataSource.destroy();
    await postgresContainer.stop();
});

describe.skip('Patient Integration Tests (Testcontainers)', () => {
    it('POST /patient should create a new patient', async () => {
        const res = await request(app)
            .post('/patient')
            .send({
                name: 'Jane Doe',
                dateOfBirth: '1985-05-15',
                nationalId: '123456789012'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Jane Doe');
    });

    it('POST /patient should prevent duplicate national ID', async () => {
        const res = await request(app)
            .post('/patient')
            .send({
                name: 'John Doe',
                dateOfBirth: '1985-05-15',
                nationalId: '123456789012' // same ID
            });

        expect(res.status).toBe(409);
    });
});
