import { Request, Response } from 'express';
import { AppDataSource } from '../database/AppDataSource';
import { Invoice, InvoiceStatus } from '../entity/Invoice';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

export class InvoiceController {
    static async getInvoiceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoiceRepo = AppDataSource.getRepository(Invoice);
            const invoice = await invoiceRepo.findOneBy({ id });
            if (!invoice) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
            return res.json(invoice);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async processPayment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoiceRepo = AppDataSource.getRepository(Invoice);
            
            const invoice = await invoiceRepo.findOneBy({ id });
            if (!invoice) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
            
            // Mock payment processing
            invoice.status = InvoiceStatus.PAID;
            await invoiceRepo.save(invoice);
            
            // Publish event
            await RabbitMQClient.publish('hospital_events', 'invoice.paid', {
                invoiceId: invoice.id,
                encounterId: invoice.encounterId,
                patientId: invoice.patientId,
                amount: invoice.amount
            });
            
            return res.json({ message: 'Payment processed successfully', invoice });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
