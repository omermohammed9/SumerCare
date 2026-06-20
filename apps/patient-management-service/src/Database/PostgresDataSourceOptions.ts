import Patient from "@/entity/Patient";
import {config} from "dotenv";
import Subscriber from "@/Database/Subscriber";
import { DataSourceOptions } from "typeorm";

config({path: "./src/.env"});

//This function provides the database options, using environment variables for sensitive data.
export const getPostgresDataSourceOptions = (): DataSourceOptions => {
    return {
        type: 'postgres',
        host: String(process.env.DB_HOST) || 'No Host Provided for Postgres',
        port: parseInt(process.env.DB_PORT || 'No Port Provided for Postgres' ),
        username: String(process.env.DB_USERNAME) || 'No Username Provided for Postgres',
        password: String(process.env.DB_PASSWORD) || 'No Password Provided for Postgres',
        database: String(process.env.DB_DATABASE) || 'No Database Provided for Postgres',
        synchronize: process.env.NODE_ENV !== 'production',
        logging: false,
        entities:  [
            Patient
        ],
        subscribers: [
            Subscriber
        ],
        migrations: [
            process.env.NODE_ENV === 'production' ? 'dist/migration/*.js' : 'src/migration/*.ts'
        ],
        migrationsRun: process.env.NODE_ENV === 'production',
    };
}
