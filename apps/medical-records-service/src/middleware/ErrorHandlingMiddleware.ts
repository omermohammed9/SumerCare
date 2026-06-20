import { Request, Response, NextFunction } from 'express';
import { logger } from '../winston/logger';

export const ErrorHandlingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Exception:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message
    });
};
