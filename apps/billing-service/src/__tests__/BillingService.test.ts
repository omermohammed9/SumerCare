import { BillingService } from '../service/BillingService';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entity/Invoice';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

jest.mock('../rabbitmq/RabbitMQClient', () => ({
    RabbitMQClient: {
        subscribe: jest.fn(),
        publish: jest.fn()
    }
}));

describe('BillingService', () => {
    let billingService: BillingService;
    let mockRepository: jest.Mocked<Repository<Invoice>>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock the TypeORM repository
        mockRepository = {
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<Invoice>>;

        billingService = new BillingService(mockRepository);
    });

    describe('initSubscriptions', () => {
        it('should subscribe to encounter.finalized', async () => {
            await billingService.initSubscriptions();

            expect(RabbitMQClient.subscribe).toHaveBeenCalledWith(
                'hospital_events',
                'billing_queue',
                'encounter.finalized',
                expect.any(Function)
            );
        });

        it('should create an invoice on encounter.finalized', async () => {
            await billingService.initSubscriptions();

            const subscribeCalls = (RabbitMQClient.subscribe as jest.Mock).mock.calls;
            const encounterFinalizedCallback = subscribeCalls.find(call => call[2] === 'encounter.finalized')[3];

            const mockMsg = {
                patientId: 'patient-123',
                encounterId: 'encounter-123'
            };

            mockRepository.save.mockResolvedValue({} as any);

            await encounterFinalizedCallback(mockMsg);

            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            const savedInvoice = mockRepository.save.mock.calls[0][0];
            expect(savedInvoice.patientId).toBe('patient-123');
            expect(savedInvoice.encounterId).toBe('encounter-123');
            expect(savedInvoice.amount).toBe(150.00);
            expect(savedInvoice.status).toBe(InvoiceStatus.PENDING);
        });

        it('should publish billing.failed if invoice save fails', async () => {
            await billingService.initSubscriptions();

            const subscribeCalls = (RabbitMQClient.subscribe as jest.Mock).mock.calls;
            const encounterFinalizedCallback = subscribeCalls.find(call => call[2] === 'encounter.finalized')[3];

            const mockMsg = {
                patientId: 'patient-123',
                encounterId: 'encounter-123'
            };

            const dbError = new Error('Database down');
            mockRepository.save.mockRejectedValue(dbError);

            await encounterFinalizedCallback(mockMsg);

            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            expect(RabbitMQClient.publish).toHaveBeenCalledWith('hospital_events', 'billing.failed', {
                encounterId: 'encounter-123',
                reason: 'Failed to save invoice to database'
            });
        });
    });
});
