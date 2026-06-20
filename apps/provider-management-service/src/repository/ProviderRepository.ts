import { AppDataSource } from '../database/AppDataSource';
import { Provider } from '../entity/Provider';

export const ProviderRepository = AppDataSource.getRepository(Provider).extend({
    // Custom repository methods can go here if needed
});
