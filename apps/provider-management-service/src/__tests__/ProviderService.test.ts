import { providerService } from '../service/ProviderService';
import { ProviderRepository } from '../repository/ProviderRepository';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

// Mock dependencies
jest.mock('../repository/ProviderRepository', () => ({
    ProviderRepository: {
        create: jest.fn(),
        save: jest.fn(),
        findOneBy: jest.fn(),
        remove: jest.fn()
    }
}));

jest.mock('../rabbitmq/RabbitMQClient', () => ({
    RabbitMQClient: {
        publish: jest.fn()
    }
}));

describe('ProviderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProvider', () => {
        it('should successfully create a provider and publish event', async () => {
            const mockProviderData = { firstName: 'John', lastName: 'Doe', specialty: 'Cardiology', email: 'john@example.com' };
            const savedProvider = { id: '123', ...mockProviderData };

            (ProviderRepository.create as jest.Mock).mockReturnValue(mockProviderData);
            (ProviderRepository.save as jest.Mock).mockResolvedValue(savedProvider);
            (RabbitMQClient.publish as jest.Mock).mockResolvedValue(undefined);

            const result = await providerService.createProvider(mockProviderData);

            expect(ProviderRepository.create).toHaveBeenCalledWith(mockProviderData);
            expect(ProviderRepository.save).toHaveBeenCalledWith(mockProviderData);
            expect(RabbitMQClient.publish).toHaveBeenCalledWith('hospital_events', 'provider.created', {
                id: '123',
                firstName: 'John',
                lastName: 'Doe',
                specialty: 'Cardiology'
            });
            expect(result).toEqual(savedProvider);
        });

        it('should throw ConflictError on duplicate email/license', async () => {
            const mockProviderData = { email: 'john@example.com' };
            
            const dbError = new Error('duplicate');
            (dbError as any).code = '23505';

            (ProviderRepository.create as jest.Mock).mockReturnValue(mockProviderData);
            (ProviderRepository.save as jest.Mock).mockRejectedValue(dbError);

            await expect(providerService.createProvider(mockProviderData)).rejects.toThrow('Provider with given email or license number already exists');
        });
    });

    describe('getProviderById', () => {
        it('should return provider if found', async () => {
            const savedProvider = { id: '123', firstName: 'John' };
            (ProviderRepository.findOneBy as jest.Mock).mockResolvedValue(savedProvider);

            const result = await providerService.getProviderById('123');
            expect(result).toEqual(savedProvider);
        });

        it('should throw error if provider not found', async () => {
            (ProviderRepository.findOneBy as jest.Mock).mockResolvedValue(null);
            await expect(providerService.getProviderById('123')).rejects.toThrow('Provider not found');
        });
    });
});
