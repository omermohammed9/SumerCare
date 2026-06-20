import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entity/Invoice';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

export class BillingService {
    private invoiceRepository: Repository<Invoice>;

    constructor(repository: Repository<Invoice>) {
        this.invoiceRepository = repository;
    }

    async initSubscriptions() {
        await RabbitMQClient.subscribe('hospital_events', 'billing_queue', 'encounter.finalized', async (msg) => {
            try {
                // Determine mock amount based on logic
                const mockAmount = 150.00;
                
                const invoice = new Invoice();
                invoice.patientId = msg.patientId;
                invoice.encounterId = msg.encounterId;
                invoice.amount = mockAmount;
                invoice.status = InvoiceStatus.PENDING;
                
                await this.invoiceRepository.save(invoice);
                console.log(`[BillingService] Auto-generated invoice for encounter ${msg.encounterId}`);
            } catch (error) {
                console.error(`[BillingService] Error generating invoice:`, error);
                // Publish BillingFailed event (Saga Orchestration compensating transaction)
                await RabbitMQClient.publish('hospital_events', 'billing.failed', {
                    encounterId: msg.encounterId,
                    reason: 'Failed to save invoice to database'
                });
            }
        });
    }
}
