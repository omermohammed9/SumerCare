# SumerCare - Enterprise Hospital Ecosystem

![SumerCare Architecture Banner](https://img.shields.io/badge/Architecture-Event--Driven-blue.svg) ![Microservices](https://img.shields.io/badge/Services-5%20Microservices-success.svg) ![Docker](https://img.shields.io/badge/Containerized-Docker%20Compose-2496ED.svg) ![Testing](https://img.shields.io/badge/Test%20Coverage-Jest%20%2B%20Supertest-green)

**SumerCare** is a highly advanced, massively scalable, and structurally resilient enterprise healthcare software architecture. It separates distinct hospital departments into autonomous microservices, utilizing a robust event-driven backbone to ensure seamless data flow and distributed transaction reliability.

---

## 🏗️ Architectural Overview

This monorepo utilizes a **Turborepo** structure linking five independent microservice domains. Instead of relying on brittle, synchronous HTTP API calls between departments, the system communicates asynchronously via a **RabbitMQ Event Bus**.

### The 5 Microservice Domains:
1. **Patient Management Service** (`:5000`) - The authoritative source for patient identity and registration.
2. **Provider Management Service** (`:6000`) - The authoritative source for doctors, staff, and medical licenses.
3. **Appointment Scheduling Service** (`:8000`) - A self-sufficient booking system maintaining a local replica of patients to guarantee 100% uptime even if the Patient Service is offline.
4. **Medical Records Service** (`:7000`) - Generates Encounters (medical visits) and strictly encrypts Protected Health Information (PHI) like diagnoses and notes using AES-256-GCM.
5. **Billing Service** (`:9000`) - Generates Invoices securely once Encounters are finalized.

### The Network Infrastructure:
- **API Gateway (NGINX):** Routes traffic, handles CORS, and strictly rate-limits external requests.
- **Orchestration:** Fully containerized using `docker-compose`.
- **Shared Core Package:** A strictly typed `@microservices/shared-core` npm workspace that standardizes Types, Errors, and Cryptographic transformers across all 5 services simultaneously.

---

## 🌪️ Saga Orchestration (Distributed Transactions)

SumerCare is built to handle failure gracefully using the **Saga Pattern**. 

When a multi-step transaction occurs (e.g., An Encounter is finalized, which triggers an Invoice generation), the system relies on compensating transactions to maintain data integrity.
If the **Billing Service** fails to save an invoice to its database, it will publish a `billing.failed` event back to the Event Bus. The **Medical Records Service** will instantly catch this event and gracefully rollback the Encounter's status to `FAILED_BILLING`. No dangling records, no manual cleanup.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Language** | TypeScript 5 (Strict Mode) |
| **Framework** | Express 4 |
| **Database** | PostgreSQL 15 |
| **ORM** | TypeORM 0.3 |
| **Event Bus** | RabbitMQ |
| **Caching** | Redis 7 |
| **Testing** | Jest & Supertest |
| **Monorepo** | Turborepo (`turbo`) |

---

## 🚀 Quick Start (Local Docker Cluster)

You do not need to install Node or Postgres locally to run the entire hospital network.

```bash
# 1. Clone the repository
git clone https://github.com/omermohammed9/SumerCare.git
cd SumerCare

# 2. Spin up the entire infrastructure and all 5 services
docker-compose up --build
```

### Accessing the Gateway:
Once active, the NGINX Gateway will act as the single point of entry for the ecosystem:
- `http://localhost/encounters/` -> Routes to Medical Records
- `http://localhost/invoices/` -> Routes to Billing

---

## 🧪 Comprehensive Testing

SumerCare maintains strict structural integrity through extensive automated testing:
- **Unit Tests (`npm test`):** Every service has an isolated Jest test suite mocking PostgreSQL and RabbitMQ, proving that Saga rollbacks and domain logic behave deterministically.
- **End-to-End Tests (`saga-workflow.test.js`):** A massive global Supertest script that automatically triggers an entire hospital journey: *Patient Registration -> Provider Assigning -> Appointment Booking -> Draft Encounter Auto-generation -> Invoice Auto-generation -> Invoice Failure Rollbacks*.
