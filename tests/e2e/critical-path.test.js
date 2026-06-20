const request = require('supertest');

/**
 * E2E Critical Path Test
 * Prerequisite: Both services (Patient 5000, Appointment 8000), Redis, and Postgres must be running.
 */
describe('E2E Critical Path: Patient Creation to Appointment Booking', () => {
    const patientSvc = 'http://localhost:5000';
    const apptSvc = 'http://localhost:8000';
    
    let patientId;

    it('1. Should create a new patient', async () => {
        const res = await request(patientSvc)
            .post('/patient')
            .send({
                name: 'E2E Test Patient',
                dateOfBirth: '2000-01-01',
                nationalId: `E2E-${Date.now()}`
            });
        
        expect(res.status).toBe(201);
        patientId = res.body.id;
    });

    it('2. Should wait for Redis Pub/Sub to sync cache', async () => {
        // Wait 1 second to ensure the subscriber picks up the event
        await new Promise(r => setTimeout(r, 1000));
    });

    it('3. Should schedule an appointment for the new patient', async () => {
        const res = await request(apptSvc)
            .post('/appointment')
            .send({
                patientId: patientId,
                date: '2026-12-01',
                AppointmentTime: '14:00',
                duration: 60
            });
        
        expect(res.status).toBe(201);
        expect(res.body.patientId).toBe(patientId);
    });
});
