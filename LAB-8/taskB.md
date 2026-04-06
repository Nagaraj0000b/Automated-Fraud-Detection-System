# Report for LAB-8 Part B: White Box and Black Box Testing

## Overview
Part B of Assignment 8 requires writing and performing test cases for both White Box Testing and Black Box Testing. To accomplish this, I have set up a comprehensive testing environment in the backend (`DEVELOPMENT-MODULES/server`) using **Jest** as the test runner and **Supertest** to make HTTP assertions. 

A local, in-memory MongoDB server (`mongodb-memory-server`) was utilized to ensure tests can be run reliably without affecting the primary development database.

## 1. White Box Testing (Unit Testing)
**Goal:** To test the internal logic, structure, and execution paths of the application code.

**Implementation 1: Authentication Middleware** 
I tested the Authentication Middleware (`DEVELOPMENT-MODULES/server/middleware/auth.middleware.js`), specifically focusing on the `verifyToken` function. This function has various internal conditional branches (if/else statements) to handle missing tokens, invalid tokens, and valid tokens.

**Implementation 2: Transaction Controller (Fraud Rules)**
I tested the Transaction Creation logic (`DEVELOPMENT-MODULES/server/controllers/transaction.controller.js`) focusing on the internal rule engine that flags transactions based on their amounts.
-   **Test Paths:** Low risk (< 50k) gets 'approved', medium risk (50k - 100k) gets 'flagged', high risk (> 100k) gets 'blocked'.

**Implementation 3: Dashboard Controller (Aggregation Logic)**
I tested the Dashboard Aggregation logic (`DEVELOPMENT-MODULES/server/controllers/dashboard.controller.js`), specifically checking that internal data summation and mathematical equations work (e.g., calculating the precise transaction approval rate).
-   **Test Paths:** Normal calculation yielding `85.0%`, and the fallback edge case yielding `0%` when no transactions exist.

**Implementation 4: User Controller (Reactivation Workflow)**
I tested the Reactivation Request logic (`DEVELOPMENT-MODULES/server/controllers/user.controller.js`), checking the internal validity guards.
-   **Test Paths:** Rejecting if the user doesn't exist, rejecting if the user isn't suspended, rejecting if a request is already pending, and succeeding for a valid request.

## 2. Black Box Testing (Integration/API Testing)
**Goal:** To test the application's functionality from the outside (its inputs and outputs) without examining the internal code structure.

**Implementation 1: Authentication API**
I tested the User Authentication API Endpoints (`POST /api/auth/signin` and `POST /api/auth/signup`) using Supertest to send real HTTP requests to the Express server.
-   **Test Paths:** Handling missing data (400), incorrect credentials (401), and successful user registration (201).

**Implementation 2: Transaction API**
I tested the Transaction API Endpoints (`POST /api/transactions/create`) focusing on endpoint security and input processing.
-   **Test Paths:** Unauthenticated access rejection (401), successful low-value creation (201), and auto-flagging high-value creation (201).

**Implementation 3: Dashboard API**
I tested the Dashboard API Endpoints (`GET /api/dashboard/stats` and `GET /api/dashboard/recent-users`).
-   **Test Paths:** Verifying the endpoints reject unauthenticated requests (401), and ensuring that authenticated requests properly return JSON structures with the expected keys (200).

**Implementation 4: User API (Role-Based Access Control)**
I tested the User Management API (`GET /api/users` and `POST /api/users/reactivation-request`).
-   **Test Paths:** Ensuring a public user can hit the reactivation endpoint, verifying standard logged-in users are blocked from fetching the user list (403), and verifying admins successfully receive the user list (200).

## Test Execution Results
All test cases were executed using the command `npm test`.

```text
> fraud-detection-auth-server@1.0.0 test
> jest

Test Suites: 8 passed, 8 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        2.678 s, estimated 3 s
Ran all test suites.
```

**Conclusion:** 
Both White Box and Black Box testing methodologies have been successfully implemented and performed across all major system components (Authentication, Transactions, User Management, and Dashboard Analytics). The code functions precisely as expected across 24 test paths and inputs.