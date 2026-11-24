
# AI Usage Disclosure

**Project:** TriageSync  
**Assessment:** ENGN-F1 Full Stack Developer  
**Candidate:** Chaiti Sen

---

## 1. AI Tools Used

| Tool | Purpose |
|---|---|
| OpenAI ChatGPT | Development guidance, code generation, debugging, architecture discussion, testing, UI design, and documentation assistance |

AI assistance was used during the assessment development
window to support implementation and technical problem-solving.

## 2. Areas of AI Assistance

### Project Planning and Architecture

- Breaking down assessment requirements into development tasks.
- Organizing the frontend and backend folder structure.
- Designing the relational database schema.
- Discussing REST API architecture and business rules.

### Backend Development

- Assistance with Express controllers, services, and routes.
- Prisma schema and migration guidance.
- JWT authentication and role-based authorization.
- Request validation using Zod.
- Ticket classification and human override protection.
- Database transactions and booking concurrency controls.

### Frontend Development

- React component structure and state management.
- Responsive dashboard layout and visual design.
- API integration using Axios.
- Optimistic UI updates and rollback implementation.
- Administrative analytics and data visualization.

### Debugging and Testing

- Troubleshooting Prisma configuration and database connectivity.
- Generating classifier unit tests and concurrency test scripts.
- Investigating database connection pool errors.
- Resolving ESLint and frontend build issues.

### Performance Optimization

- Designing reproducible API benchmark scripts.
- Evaluating composite database indexing.
- Interpreting measured API latency.
- Implementing lazy loading for the analytics dashboard.

### Documentation

- Structuring README.md according to assessment requirements.
- Preparing the architecture and engineering explanation
  in SOLUTION.md.
- Organizing this AI usage disclosure.

---

## 3. Verification of AI Suggestions

### Case Study 1: Booking Concurrency

During concurrency testing, the application initially
returned the following results for ten simultaneous requests:

- 1 successful booking (HTTP 201).
- 7 conflict responses (HTTP 409).
- 2 internal server errors (HTTP 500).

An initial AI suggestion was to increase the interactive
transaction acquisition wait and execution timeout.

After applying the suggested changes and repeating the
test, one request still returned HTTP 500.

The backend error logs were then examined and revealed
Prisma error P2024, indicating connection pool exhaustion.

The connection pool configuration was subsequently
adjusted:

- Connection limit: 5 to 10.
- Pool timeout: 10 seconds to 60 seconds.

The latest successful test produced:

| Metric | Result |
|---|---:|
| Concurrent requests | 10 |
| Successful bookings | 1 |
| Conflict responses | 9 |
| Internal server errors | 0 |

This demonstrated that the initial AI suggestion was
insufficient on its own. Examining actual error logs
and repeating the test were necessary to investigate
the underlying problem.

The latest successful test took approximately 44 seconds,
so further performance and reliability testing remains
necessary.

### Case Study 2: Database Index Optimization

AI assistance suggested adding a composite index to
support ordered ticket retrieval.

The optimization was evaluated using 618 database
records and 30 measured requests before and after
the change.

| Metric | Before | After |
|---|---:|---:|
| Average API latency | 2465.27 ms | 3143.85 ms |

Contrary to the expected improvement, the measured
end-to-end latency increased by approximately 27.53%.

Rather than reporting an assumed performance improvement,
the actual results were retained in SOLUTION.md.

This reinforced the importance of validating AI-generated
optimization suggestions through reproducible measurements.

---

## 4. Verification and Accountability

AI-generated suggestions and code were used as development
assistance rather than treated as automatically correct.

Implementation verification included:

- Executing database migrations.
- Testing REST API responses.
- Running classifier unit tests.
- Running concurrent booking requests.
- Inspecting backend error logs.
- Running frontend lint and production build checks.
- Recording actual performance measurements.

The candidate remains responsible for reviewing the
implementation, understanding its behavior, and explaining
the engineering decisions during the assessment viva.

---

## 5. Declaration

I acknowledge the use of ChatGPT for development guidance,
code generation, debugging, testing, design suggestions,
and documentation assistance during this assessment.

The reported test results and performance measurements
are based on actual observed executions.

I take responsibility for the submitted implementation,
its engineering decisions, and its documented limitations.
