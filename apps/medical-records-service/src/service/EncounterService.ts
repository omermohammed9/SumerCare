import { Repository } from 'typeorm';
import { Encounter } from '../entity/Encounter';
import { RabbitMQClient } from '../rabbitmq/RabbitMQClient';

export class EncounterService {
    private encounterRepository: Repository<Encounter>;

    constructor(repository: Repository<Encounter>) {
        this.encounterRepository = repository;
    }

    async initSubscriptions() {
        await RabbitMQClient.subscribe('hospital_events', 'medical_records_queue', 'appointment.completed', async (msg) => {
            try {
                const encounter = new Encounter();
                encounter.patientId = msg.patientId;
                encounter.providerId = msg.providerId;
                encounter.appointmentId = msg.appointmentId;
                encounter.diagnosis = "Pending";
                encounter.notes = "Auto-generated from completed appointment";
                
                await this.encounterRepository.save(encounter);
                console.log(`[EncounterService] Auto-generated draft encounter for appointment ${msg.appointmentId}`);
            } catch (error) {
                console.error(`[EncounterService] Error generating encounter:`, error);
            }
        });

        // Saga Orchestration: Compensating Transaction
        await RabbitMQClient.subscribe('hospital_events', 'medical_records_saga_queue', 'billing.failed', async (msg) => {
            try {
                const encounter = await this.encounterRepository.findOneBy({ id: msg.encounterId });
                if (encounter) {
                    encounter.status = 'FAILED_BILLING';
                    await this.encounterRepository.save(encounter);
                    console.log(`[EncounterService] Saga Rollback: Encounter ${encounter.id} marked as FAILED_BILLING due to: ${msg.reason}`);
                }
            } catch (error) {
                console.error(`[EncounterService] Saga Rollback error:`, error);
            }
        });
    }
}
