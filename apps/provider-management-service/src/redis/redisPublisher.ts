import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { logger } from '../winston/logger';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisPublisher = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisPublisher.on('connect', () => logger.info('Redis Publisher connected'));
redisPublisher.on('error', (err) => logger.error(`Redis Publisher Error: ${err.message}`));

export const publishProviderEvent = async (eventType: string, payload: any) => {
    try {
        const messageId = await redisPublisher.xadd('provider_events', '*', 'event', eventType, 'payload', JSON.stringify(payload));
        logger.info(`Published ${eventType} to provider_events stream. ID: ${messageId}`);
    } catch (error) {
        logger.error(`Failed to publish event ${eventType}:`, error);
        throw error;
    }
};
