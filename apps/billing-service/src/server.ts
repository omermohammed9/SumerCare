import app from './app';
import { AppDataSource } from './database/AppDataSource';
import { logger } from './winston/logger';
import { BillingService } from './service/BillingService';
import { Invoice } from './entity/Invoice';

const PORT = process.env.PORT || 9000;

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});

AppDataSource.initialize().then(async () => {
    logger.info('Connected to PostgreSQL Database for Billing Service');
    
    // Initialize RabbitMQ subscriptions
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const billingService = new BillingService(invoiceRepo);
    await billingService.initSubscriptions();
    logger.info('RabbitMQ subscriptions initialized for Billing Service');
    
    app.listen(PORT, () => {
        logger.info(`Billing Service listening on port ${PORT}`);
    });
}).catch(error => {
    logger.error('Database connection error:', error);
});
