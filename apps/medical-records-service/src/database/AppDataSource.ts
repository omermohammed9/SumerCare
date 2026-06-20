import { DataSource } from 'typeorm';
import { Encounter } from '../entity/Encounter';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'medical_records_db',
    synchronize: process.env.NODE_ENV === 'development',
    logging: false,
    entities: [Encounter],
    migrations: ['src/migration/**/*.ts'],
    subscribers: [],
});
