import { NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Async(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args: any[]) {
        const next = args[2] as NextFunction;

        Promise.resolve(originalMethod.apply(this, args))
            .catch(next);
    };
}

export default Async;
 /* This decorator handles the promise returned by the async methods and ensures that any caught errors are passed to the next middleware,
    which is typically an error-handling middleware in Express.
     Here's how you can use this Async decorator with your controller methods*/