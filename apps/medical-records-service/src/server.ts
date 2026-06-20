import app from './app';
import { AppDataSource } from './database/AppDataSource';
import { logger } from './winston/logger';
import { EncounterService } from './service/EncounterService';
import { Encounter } from './entity/Encounter';

const PORT = process.env.PORT || 7000;

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});

AppDataSource.initialize().then(async () => {
    logger.info('Connected to PostgreSQL Database for Medical Records Service');
    
    // Initialize RabbitMQ subscriptions
    const encounterRepo = AppDataSource.getRepository(Encounter);
    const encounterService = new EncounterService(encounterRepo);
    await encounterService.initSubscriptions();
    logger.info('RabbitMQ subscriptions initialized for Medical Records Service');
    
    app.listen(PORT, () => {
        logger.info(`Medical Records Service listening on port ${PORT}`);
    });
}).catch(error => {
    logger.error('Database connection error:', error);
});
