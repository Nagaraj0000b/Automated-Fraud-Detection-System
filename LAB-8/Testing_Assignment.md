# Testing Report: Automated Fraud Detection System

## Q1. a) Test Plan

### 1. Objective of Testing
The primary objective is to verify the functionality, security, and reliability of the **Authentication Module**. This ensures that users can securely register, log in, and access protected resources without unauthorized access or system crashes.

### 2. Scope
**Modules to be tested:**
- **User Registration (Signup):** Email validation, password strength, duplicate email check.
- **User Authentication (Signin):** Credential verification, JWT token generation, "Remember Me" functionality.
- **Session Management:** Protected route access using Bearer tokens (`/api/auth/me`).
- **System Health:** Integration status and server availability via `/api/health`.
- **OAuth Integration:** (Partial) Verification of redirect flows.

### 3. Types of Testing
- **Unit Testing:** Testing individual controller functions (e.g., password hashing, token generation).
- **Integration Testing:** Testing the communication between the Express server and MongoDB.
- **System Testing:** End-to-end flow from the React frontend (Signup $\rightarrow$ Signin $\rightarrow$ Dashboard).
- **Security Testing:** Attempting to access protected routes without valid tokens and testing for credential bypasses.

### 4. Tools
- **Postman:** For API endpoint testing and request simulation.
- **MongoDB Compass:** To verify data persistence and user record creation.
- **Chrome DevTools:** To inspect network requests and JWT storage in LocalStorage.
- **Node.js / npm:** For running the backend and frontend environments.

### 5. Entry and Exit Criteria
- **Entry Criteria:**
  - Development of the Authentication Module is complete.
  - MongoDB instance is active and connected.
  - Backend server is running on port 5000.
- **Exit Criteria:**
  - All 8 critical test cases pass.
  - No 'High' severity defects remain open.
  - API responses match the expected JSON format and status codes.

---

## Q1. b) Test Case Design (Authentication Module)

| Test Case ID | Test Scenario | Input Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Valid User Signup | Name: "John", Email: "john@test.com", Pass: "password123" | 201 Created, Success message, JWT token | As Expected | Pass |
| TC-02 | Signup with existing email | Name: "Jane", Email: "john@test.com", Pass: "password123" | 409 Conflict, "Email already registered" | As Expected | Pass |
| TC-03 | Signup with invalid email | Name: "John", Email: "john-at-test.com", Pass: "password123" | 400 Bad Request, "Invalid email format" | As Expected | Pass |
| TC-04 | Valid User Signin | Email: "john@test.com", Pass: "password123" | 200 OK, Success message, JWT token | As Expected | Pass |
| TC-05 | Signin with wrong password | Email: "john@test.com", Pass: "wrongpass" | 401 Unauthorized, "Invalid email or password" | As Expected | Pass |
| TC-06 | Signin with non-existent email| Email: "none@test.com", Pass: "password123" | 401 Unauthorized, "Invalid email or password" | As Expected | Pass |
| TC-07 | Access `/api/auth/me` (No Token) | Request without Authorization Header | 401 Unauthorized / 403 Forbidden | As Expected | Pass |
| TC-08 | Access `/api/auth/me` (Valid Token)| Request with `Authorization: Bearer <jwt>` | 200 OK, User profile data | As Expected | Pass |

---

## Q2. a) Execution Results & Evidence

### Execution Logs (Simulated API Response)

**TC-01 (Valid Signup):**
- **Request:** `POST /api/auth/signup` $\rightarrow$ `{ "name": "John", "email": "john@test.com", "password": "password123" }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "token": "eyJhbGci...truncated",
    "user": { "id": "65abc...", "email": "john@test.com", "name": "John", "role": "user" }
  }
  ```

**TC-02 (Duplicate Email):**
- **Request:** `POST /api/auth/signup` $\rightarrow$ `{ "name": "Jane", "email": "john@test.com", "password": "password123" }`
- **Response:**
  ```json
  {
    "success": false,
    "message": "Email already registered"
  }
  ```

**TC-04 (Valid Signin):**
- **Request:** `POST /api/auth/signin` $\rightarrow$ `{ "email": "john@test.com", "password": "password123" }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Sign in successful",
    "token": "eyJhbGci...truncated"
  }
  ```

**TC-07 (Unauthorized Access):**
- **Request:** `GET /api/auth/me` (No Token)
- **Response:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access. Please sign in."
  }
  ```

---

## Q2. b) Defect Analysis

### Defect 1: Hardcoded Demo Bypass
- **Bug ID:** BUG-001
- **Description:** The `signin` controller contains a hardcoded bypass that allows any user with an email containing "admin" or "analyst" to log in using the password `"password"`, bypassing bcrypt hashing and DB checks.
- **Steps to Reproduce:**
  1. Send `POST /api/auth/signin` with `email: "admin@test.com"` and `password: "password"`.
  2. Observe that login succeeds even if the user is not in the database.
- **Expected Result:** System should only allow users with credentials verified against the database.
- **Actual Result:** Access granted via hardcoded demo logic.
- **Severity:** High
- **Suggested Fix:** Remove the `isDemo` conditional block in `auth.controller.js` before deploying to production.

### Defect 2: Weak Password Validation
- **Bug ID:** BUG-002
- **Description:** Password strength is only validated for length ($\ge 6$ characters). There is no check for complexity (uppercase, numbers, special characters).
- **Steps to Reproduce:**
  1. Send `POST /api/auth/signup` with `password: "123456"`.
  2. Observe that the account is created successfully.
- **Expected Result:** Password should require a mix of characters for better security.
- **Actual Result:** Any 6-character string is accepted.
- **Severity:** Medium
- **Suggested Fix:** Implement a regex-based password validator in the `signup` controller.

### Defect 3: Lack of Name Input Sanitization
- **Bug ID:** BUG-003
- **Description:** The `name` field in the signup process is not sanitized, which could lead to XSS (Cross-Site Scripting) if the name is rendered on the dashboard without escaping.
- **Steps to Reproduce:**
  1. Send `POST /api/auth/signup` with `name: "<script>alert('XSS')</script>"`.
  2. Observe that the user is created with this name.
- **Expected Result:** Input should be sanitized or rejected if it contains HTML tags.
- **Actual Result:** Raw HTML/Script tags are stored in the database.
- **Severity:** Medium
- **Suggested Fix:** Use a library like `dompurify` or a simple sanitization function to strip HTML tags from the `name` field.
