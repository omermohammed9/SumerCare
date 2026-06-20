export declare class CustomError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare class NotFoundError extends CustomError {
    constructor(message?: string);
}
export declare class ConflictError extends CustomError {
    constructor(message?: string);
}
export declare class BadRequestError extends CustomError {
    constructor(message?: string);
}
export declare class ServiceUnavailableError extends CustomError {
    constructor(message?: string);
}
