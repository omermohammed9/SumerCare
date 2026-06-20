# Detailed Microservices Alignment & Integration Plan

This document provides a precise implementation plan to align the **Patient-Management-Service** and the **appointment-scheduling-service** under an event-driven replication model using **Redis Pub/Sub**.

---

## 📐 1. System Alignment Details

| Metric | Patient-Management-Service | appointment-scheduling-service |
| :--- | :--- | :--- |
| **API Port** | `5000` (Loaded via `src/.env`) | `8000` (Loaded via `src/.env`) |
| **Database Name** | `PatientManagementService` | `AppointmentSchedulingService` |
| **DB Config Path** | `src/Database/PostgresDataSourceOptions.ts` *(Capital D)* | `src/database/PostgresDataSourceOptions.ts` *(Lowercase d)* |
| **Redis Dependency** | `ioredis` (installed via npm) | `ioredis` (installed via npm) |
| **Redis Port** | `6379` (Default local port) | `6379` (Default local port) |
| **Redis Channel** | `patient_events` (Shared) | `patient_events` (Shared) |

---

## 💾 2. Database Schema & Event Contract

To maintain loose coupling, the database tables and event schema must match exactly.

### Event Schema (Payload sent over Redis channel `patient_events`)
When a patient is created or updated, the publisher sends a JSON string matching this shape:
```json
{
  "event": "patient.upserted",
  "data": {
    "id": 12,
    "name": "Jane Doe"
  }
}
```

### Database Tables Comparison
* **Patient Table** (in `PatientManagementService` database):
  * `id`: Primary key (`int`, autoincrement)
  * `name`: `varchar` (not null)
  * *Other fields: gender, dateOfBirth, phoneNumber, email, address, etc.*
* **PatientCache Table** (in `AppointmentSchedulingService` database):
  * `id`: Primary key (`int`, non-autoincrement) - directly mirrors the Patient ID from the event payload.
  * `name`: `varchar` (not null)

---

## 🟩 3. Patient-Management-Service Plan (Publisher)

### Step 3.1: Install Redis dependency
Open the directory `C:\Users\omarz\Desktop\Patient Management Service` and run:
```bash
npm install ioredis
```

### Step 3.2: Configure `.env`
Add the following line to `C:\Users\omarz\Desktop\Patient Management Service\src\.env`:
```ini
REDIS_URL=redis://localhost:6379
```

### Step 3.3: Implement Redis Publisher in `PatientService.ts`
Modify `C:\Users\omarz\Desktop\Patient Management Service\src\service\PatientService.ts` to initialize Redis and broadcast events:

```typescript
// src/service/PatientService.ts
import Patient from '../entity/Patient';
import { PatientRepository } from '../repository/PatientRepository';
import UpdatePatientDto from "../dto/UpdatePatientDto";
import CreatePatientDto from "../dto/CreatePatientDto";
import Redis from 'ioredis';

// Initialize Redis Publisher
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPublisher = new Redis(redisUrl);

redisPublisher.on('error', (err) => {
    console.error('Redis Publisher Connection Error:', err);
});

export class PatientService {
    private patientRepository: PatientRepository;

    constructor(patientRepository: PatientRepository) {
        this.patientRepository = patientRepository;
    }

    async createPatient(patientData: CreatePatientDto): Promise<Patient> {
        const patient = this.patientRepository.create(patientData);
        const savedPatient = await this.patientRepository.save(patient);

        // Publish Event
        this.publishUpsertEvent(savedPatient.id, savedPatient.name);

        return savedPatient;
    }

    async updatePatient(id: number, patientData: UpdatePatientDto): Promise<Patient> {
        const patient = await this.patientRepository.findOneBy({ id });
        if (!patient) {
            throw new Error('Patient not found');
        }
        Object.assign(patient, patientData);
        const updatedPatient = await this.patientRepository.save(patient);

        // Publish Event
        this.publishUpsertEvent(updatedPatient.id, updatedPatient.name);

        return updatedPatient;
    }

    async deletePatient(id: number): Promise<void> {
        const patient = await this.patientRepository.findOneBy({ id });
        if (!patient) {
            throw new Error('Patient not found');
        }
        await this.patientRepository.delete(id);

        // Publish Event
        this.publishDeleteEvent(id);
    }

    // Helper functions
    private publishUpsertEvent(id: number, name: string) {
        const payload = JSON.stringify({
            event: 'patient.upserted',
            data: { id, name }
        });
        redisPublisher.publish('patient_events', payload)
            .then(() => console.log(`[Event Published] patient.upserted for ID: ${id}`))
            .catch(err => console.error(`[Event Failed] Failed to publish for ID: ${id}`, err));
    }

    private publishDeleteEvent(id: number) {
        const payload = JSON.stringify({
            event: 'patient.deleted',
            data: { id }
        });
        redisPublisher.publish('patient_events', payload)
            .then(() => console.log(`[Event Published] patient.deleted for ID: ${id}`))
            .catch(err => console.error(`[Event Failed] Failed to publish delete for ID: ${id}`, err));
    }
}
```

---

## 🟨 4. appointment-scheduling-service Plan (Subscriber)

### Step 4.1: Install Redis dependency
Open the directory `C:\Users\omarz\Desktop\appointment scheduling service` and run:
```bash
npm install ioredis
```

### Step 4.2: Configure `.env`
Add the following line to `C:\Users\omarz\Desktop\appointment scheduling service\src\.env`:
```ini
REDIS_URL=redis://localhost:6379
```

### Step 4.3: Create the `PatientCache` Entity
Create a new file `src/entity/PatientCache.ts` inside `C:\Users\omarz\Desktop\appointment scheduling service`:

```typescript
// src/entity/PatientCache.ts
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class PatientCache extends BaseEntity {
    @PrimaryColumn()
    id!: number; // Matches the numerical ID from Patient Service

    @Column()
    name!: string;
}
```

### Step 4.4: Register `PatientCache` in Database Configuration
Modify `src/database/PostgresDataSourceOptions.ts` to include the new `PatientCache` entity:

```typescript
// src/database/PostgresDataSourceOptions.ts
import { config } from "dotenv";
import Subscriber from "./Subscriber";
import { Appointment } from "../entity/Appointment";
import { PatientCache } from "../entity/PatientCache"; // ADD THIS IMPORT
import { DataSourceOptions } from "typeorm";

config({ path: "./src/.env" });

export const PostgresDataSourceOptions = (): DataSourceOptions => {
    return {
        type: 'postgres',
        host: String(process.env.DB_HOST) || 'No Host Provided for Postgres',
        port: parseInt(process.env.DB_PORT || 'No Port Provided for Postgres'),
        username: String(process.env.DB_USERNAME) || 'No Username Provided for Postgres',
        password: String(process.env.DB_PASSWORD) || 'No Password Provided for Postgres',
        database: String(process.env.DB_DATABASE) || 'No Database Provided for Postgres',
        synchronize: true, // Auto-creates the PatientCache table on startup
        logging: false,
        entities: [
            Appointment,
            PatientCache // ADD THIS TO ENTITIES ARRAY
        ],
        subscribers: [
            Subscriber
        ],
    };
}
```

### Step 4.5: Create the Subscriber Daemon (`subscriberService.ts`)
Create a new file `src/database/subscriberService.ts` inside `C:\Users\omarz\Desktop\appointment scheduling service`:

```typescript
// src/database/subscriberService.ts
import Redis from 'ioredis';
import AppDataSource from './database';
import { PatientCache } from '../entity/PatientCache';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisSubscriber = new Redis(redisUrl);

export function startEventSubscriber() {
    redisSubscriber.subscribe('patient_events');

    redisSubscriber.on('message', async (channel, message) => {
        try {
            const parsed = JSON.parse(message);
            const { event, data } = parsed;

            const cacheRepository = AppDataSource.getRepository(PatientCache);

            if (event === 'patient.upserted') {
                await cacheRepository.save({
                    id: data.id,
                    name: data.name
                });
                console.log(`[Cache Updated] Synced patient ID: ${data.id} - ${data.name}`);
            } else if (event === 'patient.deleted') {
                await cacheRepository.delete(data.id);
                console.log(`[Cache Updated] Deleted patient ID: ${data.id}`);
            }
        } catch (error) {
            console.error('Error handling patient event message:', error);
        }
    });

    redisSubscriber.on('error', (err) => {
        console.error('Redis Subscriber Connection Error:', err);
    });

    console.log('Redis Event Subscriber active on channel: patient_events');
}
```

### Step 4.6: Start the Subscriber Daemon in `server.ts`
Modify `C:\Users\omarz\Desktop\appointment scheduling service\src\server.ts` to start the background event subscriber once the database connection is ready:

```typescript
// src/server.ts
import app from './app';
import AppDataSource from './database/database';
import { startEventSubscriber } from './database/subscriberService'; // ADD THIS IMPORT

const PORT = process.env.PORT || 8000;

AppDataSource.initialize()
    .then(() => {
        // Start the server once database is connected
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Database connection: ${AppDataSource.options.database}`);
            
            // Start listening to events from Redis
            startEventSubscriber(); // ACTIVATE CONSUMER
        });
    })
    .catch((error) => {
        console.error('Database connection failed', error);
    });
```

### Step 4.7: Update verification logic in `AppointmentService.ts`
Modify `C:\Users\omarz\Desktop\appointment scheduling service\src\service\AppointmentService.ts` to query the local `PatientCache` table, and remove the `axios` import/calls:

```typescript
// src/service/AppointmentService.ts
import { Appointment } from '../entity/Appointment';
import { PatientCache } from '../entity/PatientCache'; // IMPORT THE CACHE ENTITY
import AppDataSource from '../database/database'; // IMPORT DATASOURCE
import { UpdateAppointmentDTO } from '../dto/UpdateAppointmentDTO';
import AppointmentRepository from "../repository/AppointmentRepository";
import CreateAppointmentDTO from "../dto/CreateAppointmentDTO";
import { isDateTimeInFuture } from "../utils/DateUtils";
// REMOVE: import axios from "axios";

class AppointmentService {
    private appointmentRepository: AppointmentRepository;

    constructor(appointmentRepository: AppointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    async verifyPatientExists(patientId: number): Promise<boolean> {
        try {
            // Check local DB instead of making network calls
            const cacheRepo = AppDataSource.getRepository(PatientCache);
            const cachedPatient = await cacheRepo.findOneBy({ id: patientId });
            return !!cachedPatient;
        } catch (error) {
            console.error("Error reading patient cache:", error);
            throw new Error('Database error checking patient registry.');
        }
    }

    // ... createAppointment, updateAppointment, etc. remain the same
}

export default AppointmentService;
```

---

## 🧪 5. Validation Protocol (Step-by-Step)

To guarantee the alignment is perfectly preserved and no steps are missed:

1. **Prerequisites Setup:**
   * Start a Redis instance locally (`docker run -d -p 6379:6379 redis` or start a native local Redis service).
   * Ensure both PostgreSQL databases `PatientManagementService` and `AppointmentSchedulingService` exist.

2. **Run Both Servers:**
   * Run `npm run dev` in `Patient Management Service`. (Confirms startup on port `5000`).
   * Run `npm run dev` in `appointment scheduling service`. (Confirms startup on port `8000`, database synchronization of `PatientCache` table, and log statement: `"Redis Event Subscriber active on channel: patient_events"`).

3. **Verify Asynchronous Event Handling:**
   * Make a `POST` request to `http://localhost:5000/patient/create` to register a patient:
     ```json
     {
       "name": "David Miller",
       "dateOfBirth": "1990-01-01"
     }
     ```
   * Confirm the Patient Service prints: `[Event Published] patient.upserted for ID: X`
   * Confirm the Appointment Service prints: `[Cache Updated] Synced patient ID: X - David Miller`

4. **Verify Disconnection Resiliency:**
   * Stop the **Patient-Management-Service** completely (kill its process).
   * Make a `POST` request to `http://localhost:8000/appointments/create` to schedule a slot for `patientId: X`:
     * Confirm the booking **succeeds** instantly, verifying the Appointment Service is completely self-sufficient.
