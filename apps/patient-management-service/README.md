<<<<<<< HEAD

# Patient Management Service

## Introduction

Patient Management Service is a robust backend application designed to efficiently manage patient data. Built with Node.js and Express.js, it leverages TypeORM for database interactions, providing a comprehensive suite of tools for patient record management.

## Technologies

- **Node.js & Express.js**: For building the server-side application.
- **TypeScript**: Ensuring type safety and enhancing code maintainability.
- **TypeORM**: ORM tool for database interactions.
- **PostgreSQL**: As the primary database.
- **Winston & Morgan**: For logging and monitoring the application.
- **Class Validator & Class Transformer**: For validating and transforming request data.

## Getting Started

### Prerequisites

- Node.js installed.
- PostgreSQL database setup.

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:

   ```bash
   cd [repository-name]
   npm install
   ```

3. Set up your `.env` file with the required environment variables:

   ```
   DB_HOST=...
   DB_PORT=...
   DB_USERNAME=...
   DB_PASSWORD=...
   DB_DATABASE=...
   ```

### Running the Application

```bash
npm start
```

## Contributing

Guidelines on how to contribute to the project. Include instructions for submitting pull requests, coding standards, and how to run tests.

## License

Specify the type of license under which the project is released, typically MIT or similar.
=======
# Patient Management Service

> **Role:** Microservice | Publisher
> **Port:** `5000`
> **Database:** PostgreSQL — `PatientManagementService`
> **Event Bus:** Redis Pub/Sub — publishes to `patient_events` channel

---

## Overview

The Patient Management Service is the **authoritative source of patient records** in a healthcare microservices system. It handles all CRUD operations on patient data and broadcasts changes as events over Redis so downstream services can maintain a local cache without making synchronous HTTP calls.

---

## Architecture

```
Client ──► Express API (:5000)
               │
               ├─► PatientController
               │       └─► PatientService
               │               ├─► PatientRepository ──► PostgreSQL
               │               └─► redisPublisher.publish('patient_events')
               │
               └─► Error Middleware ──► Winston Logger
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5 (strict mode) |
| Framework | Express 4 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 15 |
| Event Bus | Redis 7 (ioredis) |
| Logging | Winston + Morgan |
| Validation | class-validator + class-transformer |
| Container | Docker |

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15 (or Docker)
- Redis 7 (or Docker)
- npm 9+

---

## Quick Start (Local)

```bash
# 1. Clone and install
cd "Patient Management Service"
npm install

# 2. Configure environment
cp .env.example src/.env
# Edit src/.env with your DB credentials

# 3. Start infrastructure (Docker)
docker run -d -p 5432:5432 -e POSTGRES_DB=PatientManagementService -e POSTGRES_PASSWORD=postgres postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 4. Start the service
npm run dev
```

Service will be available at `http://localhost:5000`

---

## Quick Start (Docker Compose — Full Stack)

```bash
cd Desktop/microservices-workspace
docker-compose up
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_DATABASE` | `PatientManagementService` | Database name |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |

---

## API Endpoints

| Method | Path | Description | Body |
|---|---|---|---|
| `POST` | `/patient/create` | Create a patient | `{ name, dateOfBirth, gender?, email?, phoneNumber?, ... }` |
| `GET` | `/patient/getpatientbyid/:id` | Get patient by ID | — |
| `PUT` | `/patient/update/:id` | Update patient | Partial patient fields |
| `DELETE` | `/patient/delete/:id` | Delete patient | — |
| `GET` | `/health` | Health check | — |

---

## Events Published

### Channel: `patient_events`

| Event | Trigger | Payload |
|---|---|---|
| `patient.upserted` | Patient created or updated | `{ event, data: { id, name } }` |
| `patient.deleted` | Patient deleted | `{ event, data: { id } }` |

---

## Project Structure

```
src/
├── .env                          # Local secrets (not committed)
├── server.ts                     # Entry point
├── Database/                     # TypeORM DataSource config (Capital D)
├── controller/                   # HTTP request handlers
├── service/                      # Business logic
├── repository/                   # Data access layer
├── entity/                       # TypeORM entities
├── dto/                          # Input validation DTOs
├── routes/                       # Route definitions
├── middleware/                   # Error handling, etc.
├── redis/                        # Redis publisher singleton
├── winston/                      # Logger configuration
└── utils/                        # Helper utilities
.agents/                          # Architecture docs, phase checklists
.env.example                      # Environment variable template
Dockerfile                        # Production container build
docker-compose.dev.yml            # Solo dev run
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run migration:generate` | Generate TypeORM migration |
| `npm run migration:run` | Run pending migrations |

---

## Health Check

```bash
GET http://localhost:5000/health

# Response (200 OK)
{
  "status": "ok",
  "service": "patient-management-service",
  "timestamp": "2026-06-19T15:00:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

---

## Related Services

- [Appointment Scheduling Service](../appointment%20scheduling%20service/README.md) — subscribes to `patient_events`
- [System Map](../microservices-workspace/system_map.md) — full architecture topology
- [Workflow](../microservices-workspace/workflow.md) — end-to-end data flow
>>>>>>> 8b4471a (chore: save progress before monorepo migration)
