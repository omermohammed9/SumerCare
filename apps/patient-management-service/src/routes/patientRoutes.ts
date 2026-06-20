import { Router } from 'express';
import  PatientController  from '@/controller/PatientController';
import  AppDataSource  from '@/Database/database';
import {validateIdMiddlewareRequest, validationDataMiddleware} from "@/middleware/ValidationDataMiddleware";
import UpdatePatientDto from "@/dto/UpdatePatientDto";
import CreatePatientDto from "@/dto/CreatePatientDto";
import { authMiddleware } from "@/middleware/authMiddleware";

const PatientRouter = Router();
const patientController = new PatientController(AppDataSource);

PatientRouter.get('/getallpatient', authMiddleware, patientController.getAllPatients.bind(patientController));
// @ts-ignore
PatientRouter.get('/getpatientbyid/:id', authMiddleware, validateIdMiddlewareRequest, patientController.getPatient.bind(patientController));
PatientRouter.post('/create', authMiddleware, validationDataMiddleware(CreatePatientDto), patientController.addPatient.bind(patientController));
// @ts-ignore
PatientRouter.put('/updatepatient/:id', authMiddleware, validateIdMiddlewareRequest, validationDataMiddleware(UpdatePatientDto), patientController.updatePatient.bind(patientController));
// @ts-ignore
PatientRouter.delete('/deletepatient/:id', authMiddleware, validateIdMiddlewareRequest, patientController.deletePatient.bind(patientController));


export default PatientRouter;

// const PatientRouter = (): Router => {
//     const router = Router();
//     const patientController = new PatientController(AppDataSource);
//     router.get('/', patientController.getAllPatients.bind(patientController));
//     router.get('/', (req, res) => {
//         console.log('GET request received for all patients at', new Date().toISOString());
//          After logging, proceed to the actual controller method
//         patientController.getAllPatients(req, res).then(r => r).catch(e => console.error(e));
//     });
//     router.get('/:id', patientController.getPatient.bind(patientController));
//     router.post('/create', patientController.addPatient.bind(patientController));
//     // Define other routes for PUT, DELETE, etc.
//     return router;
// };

