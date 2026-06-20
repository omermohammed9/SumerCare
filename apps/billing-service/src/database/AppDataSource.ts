import { DataSource } from 'typeorm';
import { Invoice } from '../entity/Invoice';
import { InsuranceClaim } from '../entity/InsuranceClaim';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'billing_db',
    synchronize: process.env.NODE_ENV === 'development',
    logging: false,
    entities: [Invoice, InsuranceClaim],
    migrations: ['src/migration/**/*.ts'],
    subscribers: [],
});
