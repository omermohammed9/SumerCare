import app from './app';
import { AppDataSource } from './database/AppDataSource';
import { logger } from './winston/logger';

const PORT = process.env.PORT || 6000;

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});

AppDataSource.initialize().then(() => {
    logger.info('Connected to PostgreSQL Database for Provider Management Service');
    
    app.listen(PORT, () => {
        logger.info(`Provider Management Service listening on port ${PORT}`);
    });
}).catch(error => {
    logger.error('Database connection error:', error);
});
