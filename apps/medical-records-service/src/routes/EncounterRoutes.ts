import { Router } from 'express';
import { EncounterController } from '../controller/EncounterController';

const router = Router();

router.get('/:id', EncounterController.getEncounterById);
router.put('/:id', EncounterController.updateEncounter);

export default router;
