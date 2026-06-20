import { Request, Response, NextFunction } from 'express';
import { errorHandlingMiddleware } from '@/middleware/ErrorHandlingMiddleware';
import { NotFoundError } from '@/utils/CustomErrors';
import logger from '@/winston/WinstonLogger';

jest.mock('@/winston/WinstonLogger', () => ({
    error: jest.fn()
}));

describe('ErrorHandlingMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should handle CustomErrors correctly', () => {
        const error = new NotFoundError('Test not found');
        errorHandlingMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(logger.error).toHaveBeenCalledWith('Unhandled error caught by middleware', expect.any(Object));
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            statusCode: 404,
            message: 'Test not found'
        });
    });

    it('should fallback to 500 for generic errors', () => {
        const error = new Error('Database down');
        errorHandlingMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(logger.error).toHaveBeenCalledWith('Unhandled error caught by middleware', expect.any(Object));
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            statusCode: 500,
            message: 'Database down'
        });
    });
});
