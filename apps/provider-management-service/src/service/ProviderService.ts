import { ProviderRepository } from '../repository/ProviderRepository';
import { Provider } from '../entity/Provider';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';
// @ts-ignore - Assuming shared-core has NotFoundError (adjust if needed, but we linked it)
import { NotFoundError, ConflictError } from '@microservices/shared-core/errors';

export class ProviderService {
    async createProvider(data: Partial<Provider>): Promise<Provider> {
        try {
            const newProvider = ProviderRepository.create(data);
            const savedProvider = await ProviderRepository.save(newProvider);
            
            await RabbitMQClient.publish('hospital_events', 'provider.created', {
                id: savedProvider.id,
                firstName: savedProvider.firstName,
                lastName: savedProvider.lastName,
                specialty: savedProvider.specialty
            });
            
            return savedProvider;
        } catch (error: any) {
            if (error.code === '23505') { // PostgreSQL unique violation
                throw new ConflictError('Provider with given email or license number already exists');
            }
            throw error;
        }
    }

    async getProviderById(id: string): Promise<Provider> {
        const provider = await ProviderRepository.findOneBy({ id });
        if (!provider) {
            throw new NotFoundError('Provider not found');
        }
        return provider;
    }

    async updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
        const provider = await this.getProviderById(id);
        Object.assign(provider, data);
        
        try {
            const updatedProvider = await ProviderRepository.save(provider);
            
            await RabbitMQClient.publish('hospital_events', 'provider.updated', {
                id: updatedProvider.id,
                firstName: updatedProvider.firstName,
                lastName: updatedProvider.lastName,
                specialty: updatedProvider.specialty
            });
            
            return updatedProvider;
        } catch (error: any) {
             if (error.code === '23505') {
                throw new ConflictError('Provider with given email or license number already exists');
            }
            throw error;
        }
    }

    async deleteProvider(id: string): Promise<void> {
        const provider = await this.getProviderById(id);
        await ProviderRepository.remove(provider);
        
        await RabbitMQClient.publish('hospital_events', 'provider.deleted', {
            id: provider.id
        });
    }
}

export const providerService = new ProviderService();
