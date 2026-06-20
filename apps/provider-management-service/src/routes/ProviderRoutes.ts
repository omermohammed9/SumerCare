import { Router } from 'express';
import { ProviderController } from '../controller/ProviderController';

const router = Router();

router.post('/', ProviderController.createProvider);
router.get('/:id', ProviderController.getProvider);
router.put('/:id', ProviderController.updateProvider);
router.delete('/:id', ProviderController.deleteProvider);

export default router;
