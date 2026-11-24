
# TriageSync — Engineering Solution

**ENGN-F1 Full Stack Developer Assessment**

**Author:** Chaiti Sen

---

## Part A — System Architecture and Ticket Processing

### A.1 Architecture Overview

TriageSync follows a layered client-server architecture.
The frontend handles user interaction and presentation,
while the backend is responsible for authentication,
validation, business rules, and persistent data management.

```text
+-------------------------------------------+
|              React Frontend               |
|-------------------------------------------|
| Ticket Queue | Resources | My Bookings    |
| Agent Review | Admin Management           |
| Analytics Dashboard                       |
+---------------------+---------------------+
                      |
               Axios / REST API
                 Bearer JWT
                      |
+---------------------v---------------------+
|              Express Backend              |
|-------------------------------------------|
| Routes                                    |
|    |                                      |
| Authentication & Authorization            |
|    |                                      |
| Zod Validation                            |
|    |                                      |
| Controllers                               |
|    |                                      |
| Business Logic Services                   |
|    |                                      |
| Prisma ORM                                |
+---------------------+---------------------+
                      |
+---------------------v---------------------+
|             Neon PostgreSQL               |
|-------------------------------------------|
| Users | Tickets | Ticket Events           |
| Resources | Bookings                      |
|-------------------------------------------|
| Indexes | Constraints | Transactions      |
| Row Locks | Exclusion Constraints         |
+-------------------------------------------+
```

### A.2 Architectural Decisions

The application separates responsibilities into routes,
controllers, services, validators, middleware, and
database access.

This structure was selected to:

- Keep HTTP request handling separate from business logic.
- Centralize authentication and role-based authorization.
- Make validation rules reusable and maintainable.
- Support independent testing of classification logic.
- Maintain database integrity through PostgreSQL constraints.
- Reduce coupling between frontend and backend components.

### A.3 Function-by-Function Ticket Processing Trace

Consider an incoming support ticket:

```json
{
  "externalId": "EXAMPLE-001",
  "subject": "My package has not arrived",
  "body": "The delivery is delayed."
}
```

#### Step 1: Frontend Import

File: `frontend/src/pages/TicketQueue.jsx`

The Re-Import Feed action initiates the ticket import
workflow using the predefined demonstration feed.

The frontend API function `importTickets()` in
`frontend/src/api/ticket.api.js` sends the ticket array
to:

```http
POST /api/tickets/import
```

#### Step 2: Authentication

File: `backend/src/middleware/auth.middleware.js`

The `authenticate()` middleware verifies the JWT,
retrieves the authenticated user, and attaches the
user information to the request.

Invalid or expired authentication is rejected with
HTTP 401.

#### Step 3: Request Validation

File: `backend/src/validators/ticket.validator.js`

The `importTicketsSchema` validates the incoming
ticket collection, including:

- External ticket identifier.
- Subject length.
- Body length.
- Required fields.

Invalid requests are rejected before database
modification.

#### Step 4: Controller Processing

File: `backend/src/controllers/ticket.controller.js`

The import controller validates the request and invokes
the ticket import service.

It converts service results into HTTP responses and
handles database transaction conflicts.

#### Step 5: Automatic Classification

File: `backend/src/services/ticketClassifier.js`

The `classifyTicket(subject, body)` function combines
the subject and body, normalizes the text to lowercase,
and evaluates deterministic keyword rules.

Category precedence:

| Order | Category | Example keywords |
|---|---|---|
| 1 | BILLING | refund, invoice, charge, payment |
| 2 | LOGIN | password, 2fa, sign in, locked out, login |
| 3 | DELIVERY | package, arrived, shipping, tracking, delivery |
| 4 | BUG | crash, error, 500, exception, broken |
| 5 | FEATURE_REQUEST | Default category |

Priority classification:

| Priority | Condition |
|---|---|
| URGENT | urgent, production down, locked out |
| HIGH | error, refund, not arrived |
| MEDIUM | Default priority |

The example ticket produces:

```json
{
  "autoCategory": "DELIVERY",
  "priority": "HIGH"
}
```

The classifier is deterministic and does not depend
on external AI services.

#### Step 6: Database Persistence

File: `backend/src/services/ticket.service.js`

The `importTickets()` service searches for an existing
ticket using its unique externalId.

For a new ticket, it creates a database record with:

```text
autoCategory    = DELIVERY
category        = DELIVERY
priority        = HIGH
status          = OPEN
isHumanOverride = false
isReviewed      = false
```

For an existing ticket, the service updates changed
content while preserving human classification overrides.

The import runs inside a database transaction.

#### Step 7: Ticket Retrieval

The frontend invokes `fetchTickets()` from
`frontend/src/api/ticket.api.js`.

```http
GET /api/tickets
```

The backend `getTickets()` service applies filters,
search, pagination, and deterministic ordering.

Prisma parameterizes database queries. Search wildcard
characters are escaped before being used in text filters.

#### Step 8: Dashboard Rendering

The ticket queue renders the returned database records
through the ticket table component.

The frontend also invokes `fetchTicketStats()`:

```http
GET /api/stats
```

The `getTicketStats()` service aggregates category,
priority, status, reviewed count, and model agreement
statistics.

The dashboard displays these API-derived values rather
than hard-coded statistics.

### A.4 Agent Review and Audit History

An authenticated agent can modify a ticket using:

```http
PATCH /api/tickets/:id
```

The `updateTicket()` service compares the requested
changes against the existing database values.

For every changed category, priority, status, or
assigneeId, it creates a corresponding TicketEvent.

Each event records:

- Ticket identifier.
- Changed field.
- Previous value.
- New value.
- Actor.
- Timestamp.

Ticket updates and audit event creation are performed
within the same transaction.

Repeated updates containing identical values do not
create unnecessary audit events.

### A.5 Definition of Reviewed

A ticket becomes reviewed when an agent:

1. Changes its category; or
2. Changes its status from OPEN to another valid status.

Changing only the priority or assignee does not
independently mark an unreviewed ticket as reviewed.

Once reviewed, the ticket retains its reviewed state.

The model agreement rate is calculated as:

```text
Reviewed tickets where category equals autoCategory
-------------------------------------------------- x 100
             Total reviewed tickets
```

When there are no reviewed tickets, the agreement
rate is returned as zero.

This metric measures agreement with agent decisions,
not independently verified classification accuracy.

### A.6 Optimistic UI

File: `frontend/src/pages/TicketDetail.jsx`

The ticket detail interface applies requested changes
to local state immediately while the API request is
in progress.

If the request succeeds, the interface synchronizes
with the authoritative server response.

If the request fails, the previous ticket state is
restored and an error message is displayed.

This improves perceived responsiveness without
treating client-side state as the source of truth.

---

## Part B — Concurrency and Idempotency

### B.1 Booking Race Condition

A race condition can occur when multiple users request
the same resource and time slot simultaneously.

Without atomic database operations, multiple requests
could observe an available slot before any of them
inserts a booking.

This could result in overlapping reservations.

### B.2 Overlap Detection

Two bookings overlap when:

```text
newStart < existingEnd
AND
newEnd > existingStart
```

For example:

| Existing Booking | Requested Booking | Result |
|---|---|---|
| 10:00–11:00 | 10:30–11:30 | Conflict |
| 10:00–11:00 | 10:00–11:00 | Conflict |
| 10:00–11:00 | 11:00–12:00 | Allowed |
| 10:00–11:00 | 09:00–10:00 | Allowed |

Only PENDING and APPROVED bookings block availability.

CANCELLED and REJECTED bookings release the slot.

### B.3 Atomic Booking Transaction

File: `backend/src/services/booking.service.js`

The `createBooking()` function performs booking
creation inside a Prisma interactive transaction
using ReadCommitted isolation.

The transaction follows these steps:

1. Acquire a row-level lock on the authenticated user.
2. Acquire a row-level lock on the requested resource.
3. Validate the optional ticket reference.
4. Verify that the resource is active.
5. Recheck that the requested start time is in the future.
6. Count the user's future active bookings.
7. Search for overlapping active reservations.
8. Insert a PENDING booking if all checks pass.
9. Commit the transaction and release the locks.

The user lock prevents concurrent booking requests
from bypassing the maximum-three-bookings rule.

The resource lock serializes booking creation for
the same resource.

The locks are acquired in a consistent order to
reduce deadlock risk.

### B.4 Database-Level Protection

The application also uses a PostgreSQL exclusion
constraint as a second layer of protection.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "prevent_overlapping_bookings"
EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'APPROVED'));
```

The half-open interval notation `[)` includes the
start time and excludes the end time.

Consequently, consecutive bookings can share a
boundary without overlapping.

This database constraint protects booking integrity
even if an application-level overlap check is missed.

### B.5 Concurrent Request Execution

```text
Request A          Request B          Database
    |                  |                  |
    | Acquire lock    |                  |
    |------------------------------------>|
    |                  | Request lock     |
    |                  |----------------->|
    |                  |     Waiting      |
    | Check overlap    |                  |
    |------------------------------------>|
    | Insert booking   |                  |
    |------------------------------------>|
    | Commit           |                  |
    |------------------------------------>|
    | 201 Created      |                  |
    |                  | Lock acquired    |
    |                  | Check overlap    |
    |                  |----------------->|
    |                  | Booking exists   |
    |                  | 409 Conflict     |
```

### B.6 Concurrency Test Results

Test file:

`backend/tests/bookingConcurrency.test.js`

Execution command:

```bash
node --test tests/bookingConcurrency.test.js
```

The test sends ten simultaneous booking requests
for the same resource and time interval.

| Metric | Latest observed result |
|---|---:|
| Concurrent requests | 10 |
| Successful responses (201) | 1 |
| Conflict responses (409) | 9 |
| Internal server errors (500) | 0 |
| Test duration | 44,113.20 ms |
| Test status | PASSED |

Earlier test runs produced Prisma P2024 errors
because requests could not obtain database connections
within the configured connection pool timeout.

The connection pool configuration was adjusted:

| Setting | Initial | Updated |
|---|---:|---:|
| Connection limit | 5 | 10 |
| Pool timeout | 10 seconds | 60 seconds |
| Transaction acquisition wait | 20 seconds | 60 seconds |
| Transaction timeout | 30 seconds | 120 seconds |

The latest successful run returned the expected
response distribution without removing database
locks or weakening overlap constraints.

However, the approximately 44-second execution
time remains a performance limitation. Additional
repeated load tests are required to establish
reliability under sustained traffic.

### B.7 Idempotent Ticket Import

File: `backend/src/services/ticket.service.js`

The externalId field is unique at the database level.

The import service distinguishes between new tickets
and previously imported tickets.

```text
Incoming ticket
       |
       v
Does externalId already exist?
       |
       +-- No --> Classify and create ticket
       |
       +-- Yes --> Update changed subject/body
                         |
                         v
                  Human override?
                         |
                         +-- Yes --> Preserve category
                         |           and priority
                         |
                         +-- No --> Re-run classifier
```

The original autoCategory is preserved as the initial
classification reference.

When an agent changes the category, isHumanOverride
is set to true.

Subsequent imports cannot overwrite the manually
selected category.

The import operation uses a transaction and the
unique externalId constraint to prevent duplicates.
Transaction conflicts are handled through bounded
retry logic.

### B.8 Human Override Example

Initial import:

```text
externalId      = EXAMPLE-001
autoCategory    = DELIVERY
category        = DELIVERY
isHumanOverride = false
```

Agent correction:

```text
autoCategory    = DELIVERY
category        = BUG
isHumanOverride = true
isReviewed      = true
```

After re-import:

```text
autoCategory    = DELIVERY
category        = BUG
isHumanOverride = true
isReviewed      = true
```

The ticket remains a single database record and
the agent's classification is preserved.

---

## Part C — Measure First, Then Optimise

### C.1 Performance Objective

The performance investigation focused on:

```http
GET /api/tickets?limit=100
```

The objective was to evaluate whether a composite
database index could improve ordered ticket retrieval.

### C.2 Benchmark Environment

| Parameter | Configuration |
|---|---|
| Backend | Local Node.js / Express server |
| Database | Remote Neon PostgreSQL |
| Dataset | 618 tickets |
| Synthetic benchmark records | 600 |
| Existing records | 18 |
| Records requested | 100 |
| Warm-up requests | 5 |
| Measured requests | 30 |
| Request execution | Sequential |
| Authentication | JWT |
| Timing | HTTP request through JSON parsing |

The benchmark measures end-to-end API latency,
including application processing, database
communication, and response parsing.

It is not a database-only execution benchmark.

### C.3 Benchmark Reproduction

The following scripts were created:

```text
backend/scripts/seedBenchmark.js
backend/scripts/benchmarkTickets.js
backend/scripts/analyzeTicketQuery.js
```

From the backend directory, with the API running:

```bash
node scripts/seedBenchmark.js
node scripts/benchmarkTickets.js
node scripts/analyzeTicketQuery.js
```

Benchmark records use a dedicated BENCHMARK-
externalId prefix to distinguish synthetic records
from normal application tickets.

The synthetic records were removed after measurement.

### C.4 Optimization Applied

File: `backend/prisma/schema.prisma`

Ticket listing uses descending creation time with
ascending ticket ID as a deterministic tie-breaker.

The following composite index was added:

```prisma
@@index(
  [createdAt(sort: Desc), id(sort: Asc)],
  map: "tickets_created_at_id_idx"
)
```

Migration:

```text
20261124210100_optimize_ticket_listing
```

The purpose of this index is to support the ordering
used by the ticket listing query and potentially
reduce sorting overhead.

### C.5 Actual Before and After Measurements

All measurements are expressed in milliseconds.

| Metric | Before | After |
|---|---:|---:|
| Average | 2465.27 | 3143.85 |
| Median | 2172.73 | 2987.46 |
| P95 | 3430.57 | 4603.91 |
| Minimum | 2106.76 | 2149.75 |
| Maximum | 3567.09 | 4879.94 |

Average latency change:

```text
(3143.85 - 2465.27) / 2465.27 x 100

= 27.53% increase
```

The recorded benchmark did not demonstrate an
end-to-end latency improvement.

Instead, the average measured latency increased
by 678.58 milliseconds.

### C.6 Database Query Analysis

A PostgreSQL EXPLAIN ANALYZE investigation was
performed using an ordered ticket retrieval query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "tickets"
ORDER BY "createdAt" DESC, "id" ASC
LIMIT 100;
```

Observed post-optimization results:

| Metric | Value |
|---|---:|
| Planning time | 0.454 ms |
| Execution time | 0.134 ms |
| Returned rows | 100 |

The isolated SQL query executed quickly compared
with the measured HTTP request latency.

However, the complete API performs additional work,
including authentication, pagination counts,
database communication, and JSON serialization.

A comparable pre-optimization SQL execution plan
was not captured, so the isolated SQL measurement
does not establish an index-related speedup.

### C.7 Interpretation and Engineering Trade-off

The composite index is aligned with the ticket
listing order, but the measured API latency did
not improve during the recorded experiment.

Possible contributing factors include remote
database network latency, connection variability,
authentication queries, and pagination overhead.

These factors remain hypotheses rather than
independently measured causes.

The index introduces additional database storage
and maintenance overhead during insert and update
operations.

Therefore, its potential read-performance benefit
must be balanced against write costs and verified
through more controlled benchmarking.

The experiment demonstrates why optimization
decisions should be evaluated using actual
measurements rather than assumed improvements.

### C.8 Additional Frontend Optimization

The admin analytics dashboard uses Recharts, which
increased the initial JavaScript bundle size.

The analytics page was changed to use React lazy
loading and Suspense.

File: `frontend/src/App.jsx`

Observed production build results:

| Metric | Before | After |
|---|---:|---:|
| Initial JavaScript bundle | 845.32 kB | 404.73 kB |
| Initial gzip size | 249.98 kB | 126.21 kB |

Initial JavaScript bundle reduction:

```text
(845.32 - 404.73) / 845.32 x 100

= 52.12%
```

The analytics code is loaded separately when needed.

This reduces the initial bundle size at the cost of
an additional chunk request when the analytics
dashboard is opened.

Bundle size reduction is not equivalent to a
measured page-load time improvement.

---

## Part D — Improvements With One More Day

### D.1 Reduce Booking Transaction Latency

Location:

`backend/src/services/booking.service.js:LINE_NUMBER`

Function: `createBooking()`

The latest successful concurrency test required
approximately 44 seconds.

I would profile the individual database operations,
reduce sequential database round trips where safe,
and evaluate a more efficient transaction design.

The database exclusion constraint and per-user
booking limit must remain intact.

I would also perform repeated tests with multiple
users and different resources to evaluate both
correctness and latency.

### D.2 Improve Ticket Query Performance Measurement

Location:

`backend/src/services/ticket.service.js:LINE_NUMBER`

Function: `getTickets()`

I would separately measure authentication, ticket
retrieval, pagination count, and network overhead.

I would compare indexed and non-indexed queries
under equivalent conditions, using repeated
benchmark runs and complete query execution plans.

This would help determine whether the composite
index provides a meaningful benefit for the
actual workload.

### D.3 Expand Automated Test Coverage

Location:

`backend/tests/bookingConcurrency.test.js:6`

I would extend integration tests to cover:

- Concurrent bookings by different users.
- Booking ownership restrictions.
- Concurrent booking-limit enforcement.
- Cancellation and approval races.
- Invalid booking state transitions.
- Repeated ticket imports after human overrides.
- Frontend optimistic rollback behavior.
- XSS-safe ticket rendering.

### D.4 Improve Production Readiness

I would introduce structured request logging,
request correlation identifiers, rate limiting,
database performance monitoring, and broader
automated regression tests.

I would also evaluate timezone edge cases and
improve booking availability refresh behavior
after rejected reservation attempts.

---

## Conclusion

TriageSync integrates deterministic ticket triage,
human review, audit history, role-based resource
management, and transaction-safe booking workflows.

The implementation prioritizes database integrity,
maintainability, transparent performance measurement,
and a responsive user experience.

The engineering decisions are supported by observed
test results, with remaining performance limitations
documented rather than hidden.

**TriageSync — Support smarter. Schedule reliably.**
