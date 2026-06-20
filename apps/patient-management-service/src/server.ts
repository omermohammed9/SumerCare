import {config} from "dotenv";
config({path: "./src/.env"});

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import PatientRouter from "@/routes/patientRoutes";
import AppDataSource, { initializeDataSource } from "@/Database/database";
import {errorHandlingMiddleware} from "@/middleware/ErrorHandlingMiddleware";
import morgan from "morgan";
import logger from "@/winston/WinstonLogger";
import redisPublisher from "@/redis/redisPublisher";
import { correlationIdMiddleware } from "@/middleware/correlationId";
import healthRouter from "@/routes/healthRoutes";
import { metricsMiddleware, metricsAuth, register } from "@/metrics/metricsService";
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

const app = express();
app.use(correlationIdMiddleware);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: message => logger.http(message.trim()) }
}));
app.use(metricsMiddleware);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Patient Management Service API',
            version: '1.0.0',
            description: 'API Documentation for Patient Management Service',
        },
    },
    apis: ['./src/routes/*.ts', './src/controller/*.ts'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/health', healthRouter);
app.get('/metrics', metricsAuth, async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.use('/patient', PatientRouter);
app.use(errorHandlingMiddleware);

process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Process] Unhandled Promise Rejection', {
        reason: String(reason),
        promise: String(promise),
    });
});

process.on('uncaughtException', (error) => {
    logger.error('[Process] Uncaught Exception — shutting down', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

let server: any;

const startServer = async () => {
    try {
        await initializeDataSource();
        const PORT = process.env.PORT || '5000';
        server = app.listen(PORT, () => {
            logger.info(`[Patient Management Service] Started
  Port:     ${PORT}
  Database: ${process.env.DB_DATABASE} @ ${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}
  Redis:    ${process.env.REDIS_URL || 'redis://localhost:6379'}
  Env:      ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error: unknown) {
        logger.error('[Server] Initialization failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
};

if (require.main === module) {
    startServer().catch(e => logger.error(e));
}

export default app;

const shutdown = async (signal: string): Promise<void> => {
    console.info(`[Server] ${signal} received. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            console.info('[Server] HTTP server closed');

            try {
                // Close DB connection pool
                await AppDataSource.destroy();
                console.info('[DB] Connection pool closed');

                // Disconnect Redis
                await redisPublisher.quit();
                console.info('[Redis] Client disconnected');

                console.info('[Server] Graceful shutdown complete');
                process.exit(0);
            } catch (err) {
                console.error('[Server] Error during shutdown:', err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }

    // Force shutdown after 15s if drain takes too long
    setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
    }, 15000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

