
# TriageSync

### Intelligent Support Triage & Resource Scheduling

![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![REST API](https://img.shields.io/badge/REST_API-21_Endpoints-0F766E)

**ENGN-F1 Full Stack Developer Assessment**

Developed by **Chaiti Sen**

---

## 1. Project Overview

TriageSync is a full-stack support ticket triage and resource
scheduling platform designed to streamline support operations,
agent reviews, and shared resource management.

The application combines two interconnected workflows:

- **Ticket Triage:** Automatically categorizes and prioritizes
  incoming support tickets using a deterministic rule-based
  classification engine.
- **Resource Scheduling:** Enables users to reserve rooms,
  laboratories, and equipment through a concurrency-safe
  booking system.

TriageSync preserves human decisions during repeated ticket
imports, maintains an audit history of agent modifications,
and prevents overlapping resource reservations through
database-level concurrency controls.

### User Roles

| Role | Responsibilities |
|---|---|
| USER | Review tickets, browse resources, create bookings, manage personal bookings |
| ADMIN | Review tickets, manage resources, approve or reject bookings, view analytics |

---


## 2. Live Links

| Service | URL |
|---|---|
| Frontend | [Live Application](https://triagesync-chaiti487.vercel.app) |
| Backend | [Render Backend](https://engnf1-fullstack-chaiti487.onrender.com) |
| GitHub | [Source Code](https://github.com/Chaiti487/engnf1-fullstack-Chaiti487) |
| Database | Neon PostgreSQL |

The frontend is hosted on Vercel, the backend on Render,
and the persistent PostgreSQL database on Neon.

The free backend instance may experience cold-start delays
after periods of inactivity.


## 3. Seeded Credentials

The following demonstration accounts are created through
the idempotent database seed script.

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@triagesync.test | Admin@123 |
| USER | user@triagesync.test | User@123 |

### Initial Seed Data

- 2 demonstration user accounts.
- 6 resources across ROOM, LAB, and EQUIPMENT.
- At least 1 inactive resource.
- 15 support tickets covering all categories and priorities.
- 3 initially reviewed tickets.
- A ticket containing raw HTML/script content for XSS testing.
- Initial ticket audit events.

These credentials are intended exclusively for the
assessment demonstration environment.

---

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite |
| Styling | CSS, Responsive Design |
| Routing | React Router |
| HTTP Client | Axios |
| Visualization | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Neon |
| ORM | Prisma 6.19.3 |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Testing | Node.js Test Runner |
| Version Control | Git, GitHub |

### Architecture

```text
React Frontend
      |
      | REST API / JWT
      v
Express Backend
      |
      +-- Authentication Middleware
      +-- Request Validation
      +-- Controllers
      +-- Business Logic Services
      |
      v
Prisma ORM
      |
      v
Neon PostgreSQL
```

The backend follows a layered architecture that separates
routing, validation, business logic, and database access.

---

## 5. Folder Structure

```text
engnf1-fullstack-Chaiti487/
|
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |   `-- seed.js
|   |-- scripts/
|   |   |-- seedBenchmark.js
|   |   |-- benchmarkTickets.js
|   |   `-- analyzeTicketQuery.js
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- validators/
|   |   |-- app.js
|   |   `-- server.js
|   |-- tests/
|   |-- .env.example
|   `-- package.json
|
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- styles/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- .env.example
|   `-- package.json
|
|-- .gitignore
|-- .env.example
|-- README.md
|-- SOLUTION.md
`-- AI_USAGE.md
```

---

## 6. Local Setup and Database Seeding

### Prerequisites

- Node.js 22.12+ or a compatible newer LTS version
- npm
- Git
- PostgreSQL database or Neon account

### Clone the Repository

```bash
git clone https://github.com/Chaiti487/engnf1-fullstack-Chaiti487.git
cd engnf1-fullstack-Chaiti487
```

### Backend Setup

```bash
cd backend
npm ci
```

Create a `.env` file using `backend/.env.example`.

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&connection_limit=10&pool_timeout=60"
JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=24h
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate Prisma Client and apply database migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Seed the database:

```bash
npm run seed
```

The seed script uses upsert operations to prevent duplicate
users, resources, and tickets. Running the command repeatedly
does not duplicate the initial seed records.

Start the backend:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### Frontend Setup

Open a separate terminal from the repository root.

```bash
cd frontend
npm ci
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

### Automated Testing

Keep the backend running while executing integration tests.

From the backend directory:

```bash
node --test tests/ticketClassifier.test.js
node --test tests/bookingConcurrency.test.js
```

The concurrency test sends ten simultaneous booking requests
for the same resource and time slot.

Latest observed results:

| Test | Result |
|---|---|
| Classifier unit tests | 11/11 passed |
| Concurrent requests | 10 |
| Successful bookings (201) | 1 |
| Conflict responses (409) | 9 |
| Internal server errors | 0 |

The latest successful concurrency run took approximately
44 seconds. Earlier runs experienced database connection
pool timeouts.

### Frontend Quality Checks

From the frontend directory:

```bash
npm run lint
npm run build
```

---

## 7. Database Schema

TriageSync uses five primary relational entities.

| Entity | Purpose |
|---|---|
| User | Authentication, identity, and role management |
| Ticket | Support ticket classification and review |
| TicketEvent | Historical audit records for agent changes |
| Resource | Rooms, laboratories, and equipment |
| Booking | Resource reservations and approval lifecycle |

### Entity Relationships

```text
User     1 ------ N Ticket
User     1 ------ N Booking
Ticket   1 ------ N TicketEvent
Ticket   1 ------ N Booking
Resource 1 ------ N Booking
```

Ticket assignment and booking-to-ticket association
are optional relationships.

### Database Integrity

- Unique ticket external IDs.
- Case-insensitive unique user emails.
- Case-insensitive unique resource names.
- Foreign key relationships.
- Resource capacity constraints.
- Booking duration and UTC time-grid constraints.
- PostgreSQL exclusion constraint for overlapping bookings.
- Composite indexes for ticket listing and booking queries.

### Booking Lifecycle

```text
                  APPROVED
                 /        \
PENDING --------           ------ CANCELLED
   |
   +------------ REJECTED
   |
   +------------ CANCELLED
```

Only PENDING and APPROVED bookings block resource slots.

---

## 8. API Summary

Base path: `/api`

Protected endpoints require a Bearer JWT token.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /auth/me | Authenticated |

### Ticket Triage

| Method | Endpoint | Access |
|---|---|---|
| POST | /tickets/import | Authenticated |
| GET | /tickets | Authenticated |
| GET | /tickets/:id | Authenticated |
| PATCH | /tickets/:id | Authenticated |
| GET | /stats | Authenticated |

### Resource Management

| Method | Endpoint | Access |
|---|---|---|
| GET | /resources | Authenticated |
| GET | /resources/:id | Authenticated |
| POST | /resources | ADMIN |
| PATCH | /resources/:id | ADMIN |
| GET | /resources/:id/availability | Authenticated |

### Booking Management

| Method | Endpoint | Access |
|---|---|---|
| POST | /bookings | Authenticated |
| GET | /bookings/mine | Authenticated |
| GET | /bookings/:id | Owner / ADMIN |
| GET | /bookings | ADMIN |
| PATCH | /bookings/:id/cancel | Owner |
| PATCH | /bookings/:id/approve | ADMIN |
| PATCH | /bookings/:id/reject | ADMIN |

### Administration

| Method | Endpoint | Access |
|---|---|---|
| GET | /admin/stats | ADMIN |

### Standard Error Response

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "The requested slot is unavailable"
  }
}
```

### Pagination Response

```json
{
  "data": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "totalPages": 0
}
```

---

## 9. Completed Features Checklist

### Authentication and Security

- [x] User registration and login
- [x] JWT-based authentication
- [x] Password hashing with bcrypt
- [x] Role-based authorization
- [x] Protected frontend routes
- [x] Server-side request validation

### Ticket Triage

- [x] Rule-based ticket classification
- [x] Automatic priority prediction
- [x] Idempotent ticket import
- [x] Human override preservation
- [x] Original auto-category preservation
- [x] Ticket audit history
- [x] Combined search and filtering
- [x] Pagination
- [x] Optimistic updates with rollback implementation
- [x] Model agreement rate calculation
- [x] Plain-text rendering of ticket content

### Resource Scheduling

- [x] Resource search and filtering
- [x] Resource capacity validation
- [x] Daily availability visualization
- [x] UTC half-hour booking validation
- [x] Booking duration validation
- [x] Maximum future booking limit
- [x] Atomic overlap prevention
- [x] Database-level exclusion constraint
- [x] Booking cancellation
- [x] Admin approval and rejection

### Administration

- [x] Resource creation and editing
- [x] Resource activation and deactivation
- [x] Administrative booking management
- [x] Analytics dashboard
- [x] Ticket and booking statistics
- [x] Most-booked resource visualization

### Engineering and Quality

- [x] All 21 required API endpoints implemented
- [x] Idempotent database seed script
- [x] Classifier unit tests
- [x] Successful ten-request concurrency test
- [x] Reproducible API performance benchmarks
- [x] Lazy-loaded analytics dashboard
- [x] Responsive layout implementation
- [ ] Final responsive and end-to-end verification
- [ ] Live deployment verification

---

## 10. Known Limitations

- Ticket classification is deterministic and keyword-based.
  It does not currently use a trained machine learning model.

- Remote database latency can affect API response times.
  The latest successful ten-request concurrency test took
  approximately 44 seconds.

- Connection pool and transaction timeout settings were
  increased after observing Prisma P2024 errors. Further
  load testing is needed to establish sustained reliability.

- The ticket listing composite index was added, but the
  measured end-to-end API latency did not improve in the
  recorded benchmark. Additional controlled measurements
  are needed to isolate database and network overhead.

- Booking availability is displayed using the client's
  local timezone, while the API enforces UTC boundaries.
  Additional daylight-saving-time edge-case testing is needed.

- Automated test coverage currently focuses on ticket
  classification and concurrent booking creation.

- The application is designed for assessment-scale workloads.
  Production-scale monitoring, rate limiting, and broader
  integration testing are future improvements.

### Additional Documentation

- [SOLUTION.md](./SOLUTION.md) - Architecture, concurrency
  design, performance analysis, and engineering trade-offs.
- [AI_USAGE.md](./AI_USAGE.md) - Disclosure of AI assistance
  and verification of AI-generated suggestions.

---

**TriageSync**

Support smarter. Schedule reliably.
