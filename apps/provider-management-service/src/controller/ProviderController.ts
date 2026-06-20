import { Request, Response, NextFunction } from 'express';
import { providerService } from '../service/ProviderService';

export class ProviderController {
    static async createProvider(req: Request, res: Response, next: NextFunction) {
        try {
            const provider = await providerService.createProvider(req.body);
            res.status(201).json({ status: 'success', data: provider });
        } catch (error) {
            next(error);
        }
    }

    static async getProvider(req: Request, res: Response, next: NextFunction) {
        try {
            const provider = await providerService.getProviderById(req.params.id);
            res.status(200).json({ status: 'success', data: provider });
        } catch (error) {
            next(error);
        }
    }

    static async updateProvider(req: Request, res: Response, next: NextFunction) {
        try {
            const provider = await providerService.updateProvider(req.params.id, req.body);
            res.status(200).json({ status: 'success', data: provider });
        } catch (error) {
            next(error);
        }
    }

    static async deleteProvider(req: Request, res: Response, next: NextFunction) {
        try {
            await providerService.deleteProvider(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
