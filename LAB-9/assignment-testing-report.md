# Automated Fraud Detection System - Testing Report

## Q1(a) Test Plan

**Objective of testing**

Verify that the transaction module correctly processes authenticated payment requests, applies fraud rules, rejects invalid requests, and preserves user balance integrity.

**Scope**

The testing scope focused on the transaction module, especially `POST /api/transactions/create`. The key behaviors covered were authentication, fraud classification, validation of input fields, and balance updates.

**Types of testing**

- Unit testing: controller-level fraud rule behavior.
- Integration testing: route plus controller plus MongoDB Memory Server.
- System testing: end-to-end transaction creation through the Express API.

**Tools used**

- Jest
- Supertest
- MongoDB Memory Server
- Node.js / Express

**Entry criteria**

- Server dependencies installed successfully.
- Test environment available with MongoDB Memory Server.
- Transaction API endpoint reachable in the Express app.

**Exit criteria**

- Test objectives, scope, and test approach are approved.
- Eight test cases are fully defined with expected results.
- Test data, tools, and environment assumptions are documented.

## Q1(b) Test Cases for Transaction Module

| Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| TC-TX-01 | Create transaction without authentication | `POST /api/transactions/create` with amount `1000` and no token | `401 Unauthorized`, `Access token required` | Not executed | Not executed |
| TC-TX-02 | Create a normal transaction | Valid token, amount `5000`, type `transfer`, valid recipient | `201 Created`, status `approved` | Not executed | Not executed |
| TC-TX-03 | Boundary amount at `50000` | Valid token, amount `50000`, type `payment`, valid recipient | `201 Created`, status `approved` | Not executed | Not executed |
| TC-TX-04 | Large transaction above fraud threshold | Valid token, amount `60000`, type `transfer`, valid recipient | `201 Created`, status `flagged`, risk score `0.85` | Not executed | Not executed |
| TC-TX-05 | Very large transaction above block threshold | Valid token, amount `120000`, type `transfer`, valid recipient | `201 Created`, status `blocked`, risk score `0.99` | Not executed | Not executed |
| TC-TX-06 | Negative amount transaction | Valid token, amount `-500`, type `transfer`, valid recipient | `400 Bad Request`, no balance credit | Not executed | Not executed |
| TC-TX-07 | Missing recipient field | Valid token, amount `2000`, missing recipient | `400 Bad Request` | Not executed | Not executed |
| TC-TX-08 | Unsupported transaction type | Valid token, amount `2000`, type `billpay` | `400 Bad Request` | Not executed | Not executed |

