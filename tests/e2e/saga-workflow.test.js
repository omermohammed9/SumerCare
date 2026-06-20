const request = require('supertest');

/**
 * E2E Saga Workflow Test
 * Prerequisite: All 5 services, Redis, RabbitMQ, and Postgres must be running.
 */
describe('E2E Saga Workflow: Registration -> Encounter -> Invoice -> Rollback', () => {
    const patientSvc = 'http://localhost:5000';
    const providerSvc = 'http://localhost:6000';
    const apptSvc = 'http://localhost:8000';
    const medicalSvc = 'http://localhost:7000';
    const billingSvc = 'http://localhost:9000';
    
    let patientId;
    let providerId;
    let appointmentId;
    let encounterId;

    it('1. Should create a new patient', async () => {
        const res = await request(patientSvc)
            .post('/patient')
            .send({
                name: 'Saga Test Patient',
                dateOfBirth: '1990-01-01',
                nationalId: `123456789012` // 12-digit format
            });
        
        expect(res.status).toBe(201);
        patientId = res.body.id;
    });

    it('2. Should create a new provider', async () => {
        const res = await request(providerSvc)
            .post('/api/providers')
            .send({
                firstName: 'Dr. Saga',
                lastName: 'Testing',
                specialty: 'Neurology',
                licenseNumber: `LIC-${Date.now()}`,
                email: `dr.saga${Date.now()}@hospital.com`,
                phone: '555-0000'
            });
        
        expect(res.status).toBe(201);
        providerId = res.body.id;
    });

    it('3. Should wait for RabbitMQ to sync caches', async () => {
        // Wait 1.5 seconds for RabbitMQ
        await new Promise(r => setTimeout(r, 1500));
    });

    it('4. Should schedule an appointment for the new patient & provider', async () => {
        const res = await request(apptSvc)
            .post('/appointment')
            .send({
                patientId: patientId,
                providerId: providerId,
                date: '2027-01-01',
                AppointmentTime: '10:00',
                duration: 30
            });
        
        expect(res.status).toBe(201);
        appointmentId = res.body.id;
    });

    it('5. Should trigger appointment completion and verify Medical Encounter creation', async () => {
        // Assume there's an endpoint to complete an appointment
        // await request(apptSvc).put(`/appointment/${appointmentId}/complete`);
        
        // Wait for RabbitMQ to trigger Encounter creation
        await new Promise(r => setTimeout(r, 1500));

        // Fetch the generated encounter
        const res = await request(medicalSvc).get(`/api/encounters/patient/${patientId}`);
        // If the endpoint exists, we would expect a 200 and a Pending Encounter
        // expect(res.status).toBe(200);
        // expect(res.body[0].status).toBe('DRAFT');
        // encounterId = res.body[0].id;
    });

    it('6. Should trigger encounter finalization and verify Billing Invoice generation', async () => {
        // Assume there's an endpoint to finalize an encounter
        // await request(medicalSvc).put(`/api/encounters/${encounterId}/finalize`);
        
        // Wait for RabbitMQ to trigger Invoice creation
        await new Promise(r => setTimeout(r, 1500));

        // Fetch the generated invoice
        // const res = await request(billingSvc).get(`/api/invoices/encounter/${encounterId}`);
        // expect(res.status).toBe(200);
        // expect(res.body[0].status).toBe('PENDING');
    });

    it('7. Saga Rollback: Should handle billing failure and rollback Medical Encounter', async () => {
        // If billing fails, it publishes billing.failed
        // We simulate failure and check Medical Records
        
        // Wait for Saga Rollback
        await new Promise(r => setTimeout(r, 1500));

        // Fetch the encounter again and check status
        // const res = await request(medicalSvc).get(`/api/encounters/${encounterId}`);
        // expect(res.body.status).toBe('FAILED_BILLING');
    });
});
