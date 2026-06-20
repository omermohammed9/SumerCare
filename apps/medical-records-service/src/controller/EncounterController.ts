import { Request, Response } from 'express';
import { AppDataSource } from '../database/AppDataSource';
import { Encounter } from '../entity/Encounter';

export class EncounterController {
    static async getEncounterById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const encounterRepo = AppDataSource.getRepository(Encounter);
            const encounter = await encounterRepo.findOneBy({ id });
            if (!encounter) {
                return res.status(404).json({ message: 'Encounter not found' });
            }
            return res.json(encounter);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async updateEncounter(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const encounterRepo = AppDataSource.getRepository(Encounter);
            
            const encounter = await encounterRepo.findOneBy({ id });
            if (!encounter) {
                return res.status(404).json({ message: 'Encounter not found' });
            }
            
            Object.assign(encounter, data);
            await encounterRepo.save(encounter);
            
            return res.json(encounter);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
