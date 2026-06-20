/**
 * Purpose: Singleton Redis publisher instance for emitting patient events.
 * Author Scope: Lead Software Engineer / System Architect
 * Dependencies: ioredis, WinstonLogger
 */

import Redis from 'ioredis';
import logger from '@/winston/WinstonLogger';

const redisPublisher = new Redis({
  sentinels: [
    { host: process.env.REDIS_SENTINEL_HOST || 'localhost', port: parseInt(process.env.REDIS_SENTINEL_PORT || '26379') }
  ],
  name: 'mymaster',
  retryStrategy(times: number): number {
    return Math.min(times * 200, 3000);
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
});

redisPublisher.on('connect', () => logger.info('[Redis Publisher] Connected to Sentinel'));
redisPublisher.on('close', () => logger.warn('[Redis Publisher] Connection closed'));
redisPublisher.on('error', (err: Error) => logger.error(`[Redis Publisher] Error: ${err.message}`));
redisPublisher.on('reconnecting', (ms: number) => logger.warn(`[Redis Publisher] Reconnecting in ${ms}ms`));

export default redisPublisher;
