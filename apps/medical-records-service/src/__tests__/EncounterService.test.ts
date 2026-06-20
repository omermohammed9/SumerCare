import { EncounterService } from '../service/EncounterService';
import { Repository } from 'typeorm';
import { Encounter } from '../entity/Encounter';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

jest.mock('../rabbitmq/RabbitMQClient', () => ({
    RabbitMQClient: {
        subscribe: jest.fn()
    }
}));

describe('EncounterService', () => {
    let encounterService: EncounterService;
    let mockRepository: jest.Mocked<Repository<Encounter>>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock the TypeORM repository
        mockRepository = {
            save: jest.fn(),
            findOneBy: jest.fn(),
        } as unknown as jest.Mocked<Repository<Encounter>>;

        encounterService = new EncounterService(mockRepository);
    });

    describe('initSubscriptions', () => {
        it('should subscribe to appointment.completed and billing.failed', async () => {
            await encounterService.initSubscriptions();

            expect(RabbitMQClient.subscribe).toHaveBeenCalledWith(
                'hospital_events',
                'medical_records_queue',
                'appointment.completed',
                expect.any(Function)
            );

            expect(RabbitMQClient.subscribe).toHaveBeenCalledWith(
                'hospital_events',
                'medical_records_saga_queue',
                'billing.failed',
                expect.any(Function)
            );
        });

        it('should create draft encounter on appointment.completed', async () => {
            await encounterService.initSubscriptions();

            // Extract the callback for appointment.completed
            const subscribeCalls = (RabbitMQClient.subscribe as jest.Mock).mock.calls;
            const appointmentCompletedCallback = subscribeCalls.find(call => call[2] === 'appointment.completed')[3];

            const mockMsg = {
                patientId: 'patient-123',
                providerId: 'provider-123',
                appointmentId: 'apt-123'
            };

            await appointmentCompletedCallback(mockMsg);

            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            const savedEncounter = mockRepository.save.mock.calls[0][0];
            expect(savedEncounter.patientId).toBe('patient-123');
            expect(savedEncounter.diagnosis).toBe('Pending');
        });

        it('should rollback encounter status on billing.failed (Saga)', async () => {
            await encounterService.initSubscriptions();

            // Extract the callback for billing.failed
            const subscribeCalls = (RabbitMQClient.subscribe as jest.Mock).mock.calls;
            const billingFailedCallback = subscribeCalls.find(call => call[2] === 'billing.failed')[3];

            const mockEncounter = new Encounter();
            mockEncounter.id = 'encounter-123';
            mockEncounter.status = 'DRAFT';

            mockRepository.findOneBy.mockResolvedValue(mockEncounter);

            const mockMsg = {
                encounterId: 'encounter-123',
                reason: 'Insufficient funds'
            };

            await billingFailedCallback(mockMsg);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'encounter-123' });
            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            
            const savedEncounter = mockRepository.save.mock.calls[0][0];
            expect(savedEncounter.status).toBe('FAILED_BILLING');
        });
    });
});
