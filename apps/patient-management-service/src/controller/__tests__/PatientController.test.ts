import { Request, Response, NextFunction } from 'express';
import PatientController from '@/controller/PatientController';
import { PatientService } from '@/service/PatientService';
import sendResponse from '@/ResponseHelper/ResponseHelper';

jest.mock('@/service/PatientService');
jest.mock('@/ResponseHelper/ResponseHelper', () => jest.fn());
jest.mock('@/repository/PatientRepository', () => {
    return { PatientRepository: jest.fn() };
});

describe('PatientController', () => {
    let patientController: PatientController;
    let mockPatientService: jest.Mocked<PatientService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        // Create a dummy controller with a dummy DataSource
        patientController = new PatientController({} as any);
        
        // Grab the mocked service instance created inside the constructor
        mockPatientService = (patientController as any).patientService;
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        mockNext = jest.fn();
    });

    describe('addPatient', () => {
        it('should return 201 on successful creation', async () => {
            mockRequest = { body: { name: 'Omar' } };
            mockPatientService.createPatient.mockResolvedValue({ id: 1, name: 'Omar' } as any);

            await patientController.addPatient(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockPatientService.createPatient).toHaveBeenCalledWith(mockRequest.body);
            expect(sendResponse).toHaveBeenCalledWith(mockResponse, 201, { id: 1, name: 'Omar' }, 'Patient created successfully');
        });

        it('should call next on error', async () => {
            mockRequest = { body: {} };
            const error = new Error('Fail');
            mockPatientService.createPatient.mockRejectedValue(error);

            await patientController.addPatient(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getPatient', () => {
        it('should return 200 and patient if found', async () => {
            mockRequest = { validatedId: 1 } as any;
            mockPatientService.getPatientById.mockResolvedValue({ id: 1, name: 'Omar' } as any);

            await patientController.getPatient(mockRequest as Request, mockResponse as Response, mockNext);

            expect(sendResponse).toHaveBeenCalledWith(mockResponse, 200, { id: 1, name: 'Omar' }, '');
        });

        it('should return 404 if patient not found', async () => {
            mockRequest = { validatedId: 999 } as any;
            mockPatientService.getPatientById.mockResolvedValue(null);

            await patientController.getPatient(mockRequest as Request, mockResponse as Response, mockNext);

            expect(sendResponse).toHaveBeenCalledWith(mockResponse, 404, null, 'Patient not found');
        });
    });
});
