import { Router } from 'express';
import { InvoiceController } from '../controller/InvoiceController';

const router = Router();

router.get('/:id', InvoiceController.getInvoiceById);
router.post('/:id/pay', InvoiceController.processPayment);

export default router;
