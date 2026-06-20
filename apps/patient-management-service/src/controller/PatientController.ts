import { Request, Response } from 'express';
import {PatientService} from '@/service/PatientService';
import {DataSource} from "typeorm";
import {PatientRepository} from "@/repository/PatientRepository";
import {Controller, Delete, Get, Next, Patch, Post, Req, Res} from "@decorators/express";
import {validateIdMiddlewareRequest, validationDataMiddleware} from "@/middleware/ValidationDataMiddleware";
import CreatePatientDto from "@/dto/CreatePatientDto";
import UpdatePatientDto from "@/dto/UpdatePatientDto";
import Async from "@/AsyncHandler/Async";
import sendResponse from "@/ResponseHelper/ResponseHelper";

@Controller('/patient')
 class PatientController {
    private patientService: PatientService;
    constructor(dataSource: DataSource) {
        const patientRepository = new PatientRepository(dataSource);
        this.patientService = new PatientService(patientRepository);
        this.getPatient = this.getPatient.bind(this);
        this.addPatient = this.addPatient.bind(this);
        this.getAllPatients = this.getAllPatients.bind(this);
        this.updatePatient = this.updatePatient.bind(this);
        this.deletePatient = this.deletePatient.bind(this);
    }

    @Post('/create', [validationDataMiddleware(CreatePatientDto)])
    @Async
    async addPatient(@Req() req: Request, @Res() res: Response, @Next() next: Function) {
        try {
            const patient = await this.patientService.createPatient(req.body);
            sendResponse(res, 201, patient, 'Patient created successfully');
            //res.status(201).json(patient);
        } catch (e) {
            next(e);
            //res.status(500).json({ message: e.message });
        }
    }
    @Get('/getpatientbyid/:id', [validateIdMiddlewareRequest])
    @Async
    async getPatient(@Req() req: Request, @Res() res: Response, @Next() next: Function) {
        console.log(`Numeric ID in Controller - GetByID: ${req.validatedId}, Type: ${typeof req.validatedId}`);
        try {
            const patient = await this.patientService.getPatientById(req.validatedId);
            sendResponse(res, patient ? 200 : 404, patient, patient ? '' : 'Patient not found');
            //patient ? res.json(patient) : res.status(404).json({ message: 'Patient not found' });
        } catch (err) {
            next(err);
            //res.status(500).json({ message: err.message });
        }
    }

    @Get("/getallpatient")
    @Async
    async getAllPatients(@Req() req: Request, @Res()res: Response, @Next() next: Function) {
        try {
            const patients = await this.patientService.getAllPatients();
            //res.json(patients);
            sendResponse(res, patients ? 200 : 404, patients, patients ? '' : 'Patients not found');
        } catch (err) {
            next(err);
            //res.status(500).json({ message: err.message });
        }
    }
    @Patch('/updatepatient/:id', [validateIdMiddlewareRequest, validationDataMiddleware(UpdatePatientDto)])
    @Async
    async updatePatient(@Req() req: Request, @Res() res: Response, @Next() next: Function) {
        console.log(`Numeric ID in Controller - Update : ${req.validatedId}, Type: ${typeof req.validatedId}`);
        try {
            const patient = await this.patientService.updatePatient(req.validatedId, req.body);
            sendResponse(res, patient ? 200 : 404, patient, patient ? '' : 'No Patient by this ID to Update');
            //patient ? res.json(patient) : res.status(404).json({ message: 'Patient not found' });
        } catch (err: unknown) {
            res.status(500).json({ message: err instanceof Error ? err.message : 'Unknown error' });
        }
    }

    @Delete('/deletepatient/:id', [validateIdMiddlewareRequest])
    @Async
    async deletePatient(@Req () req: Request, @Res() res: Response, @Next() next: Function) {
        console.log(`Numeric ID in Controller-Delete: ${req.validatedId}, Type: ${typeof req.validatedId}`);
        try {
              await this.patientService.deletePatient(req.validatedId);
              sendResponse(res, 200, null, 'Patient deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
export default PatientController;