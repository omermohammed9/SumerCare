import { Request, Response, NextFunction } from 'express';
import logger from '@/winston/WinstonLogger';

export function errorHandlingMiddleware(error: unknown, req: Request, res: Response, next: NextFunction) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const statusCode = (error as any).statusCode || 500;

    logger.error('Unhandled error caught by middleware', {
        error: message,
        stack: (error as any).stack,
        statusCode
    });

    res.status(statusCode).json({
        status: 'error',
        message,
        statusCode
    });
}
