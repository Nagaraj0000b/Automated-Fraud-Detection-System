# LAB-8: Business Logic Layer (BLL) Documentation

## Q1. Core Functional Modules in the Business Logic Layer (BLL)

In this Automated Fraud Detection System, the **Business Logic Layer** mainly lives in the **Node/Express backend** under the `DEVELOPMENT-MODULES/server` folder. These modules sit between the React UI and the MongoDB database and implement the core rules of the system.

### 1. Authentication & Authorization Module
- **Files:**
  - `server/controllers/auth.controller.js`
  - `server/middleware/auth.middleware.js`
  - `server/models/User.js`
- **Key responsibilities (Business Logic):**
  - Validates sign‑up and sign‑in input (name, email, password format and length).
  - Enforces unique email per user and hashes passwords before saving.
  - Verifies login credentials and issues JWT tokens with different expirations (e.g., 24h vs 7d for "remember me").
  - Decodes JWT tokens on each protected API call and enforces role-based access using `requireAdmin` for admin-only endpoints.
- **Interaction with Presentation Layer (UI):**
  - React pages **SignUp** and **SignIn** (`client/src/pages/SignUp.jsx`, `client/src/pages/SignIn.jsx`) call `authAPI.signUp` and `authAPI.signIn` from `client/src/services/api.js`.
  - On success, UI stores `authToken` and `user` in `localStorage` and routes the user to dashboards (customer or admin) based on `user.role`.
  - UI also uses `authAPI.googleAuth` / `authAPI.githubAuth` for OAuth flows.

### 2. Account Management Module (Customer Bank Accounts)
- **Files:**
  - `server/controllers/account.controller.js`
  - `server/models/User.js` (embedded `accounts` array)
  - `server/routes/account.routes.js`
- **Key responsibilities (Business Logic):**
  - Ensures each user has at least one **default bank account** created (`ensureDefaultAccount`).
  - Generates user-friendly masked account numbers and default balances for accounts.
  - Allows customers to **add new bank accounts** with bank name, unique `accountId`, and starting balance.
  - Retrieves all accounts for the logged‑in user.
- **Interaction with Presentation Layer:**
  - `CustomerDashboard` (`client/src/pages/CustomerDashboard.jsx`) calls:
    - `accountAPI.getMyAccounts()` to load accounts and show them in dropdowns/cards.
    - `accountAPI.addAccount({ bankName })` from the **Add Account** modal.
  - `MakePayment` (`client/src/pages/MakePayment.jsx`) loads available accounts using `accountAPI.getMyAccounts()` and lets the user choose which account to pay from.
  - The UI displays current balance and account number, which come from BLL‑shaped `accounts` data.

### 3. Transaction & Payment Module (Fraud‑Aware Payments)
- **Files:**
  - `server/controllers/transaction.controller.js`
  - `server/models/Transaction.js`
  - `server/models/User.js`
  - `server/routes/transaction.routes.js`
- **Key responsibilities (Business Logic):**
  - `createTransaction` applies **basic fraud rules**:
    - If `amount > 100000` → mark status as `blocked` with high `riskScore`.
    - If `50000 < amount ≤ 100000` → mark status as `flagged` for analyst review with elevated `riskScore`.
    - Otherwise, approve transaction and keep `riskScore` low.
  - Persists each transaction with metadata such as type, recipient, description, location, dispute status, and risk score.
  - Adjusts balances:
    - If transaction is not `blocked`, decreases the corresponding account balance (or legacy `accountBalance`) in `User`.
  - `getUserTransactions` returns up to 50 recent transactions for the logged‑in user, optionally filtered by `accountId`.
  - `raiseDispute` enforces rules around disputes (transaction must belong to the user, can only dispute once, etc.).
- **Interaction with Presentation Layer:**
  - `MakePayment` uses `transactionAPI.createTransaction(...)` to initiate a payment from the selected account.
  - `CustomerDashboard` uses:
    - `transactionAPI.getMyTransactions(accountId)` to fetch and display transaction history.
    - `transactionAPI.raiseDispute(transactionId, reason)` from the **Dispute Transaction** modal.
  - The UI reads returned fields like `status`, `riskScore`, `disputeStatus`, and `createdAt` to show status badges (approved/flagged/blocked) and dispute information.

### 4. Dashboard & Analytics Module
- **Files:**
  - `server/controllers/dashboard.controller.js`
  - `server/models/User.js`
  - (Optionally other dashboard‑related controllers when extended)
- **Key responsibilities (Business Logic):**
  - Aggregates system‑level statistics:
    - Total users, active users, admin count.
    - Users grouped by role and status.
    - Recently created users within the last 7 days.
  - Prepares a structured `stats` object, also with placeholders for transactions, models, and risk rules (to be extended later).
  - Provides a list of recent users excluding passwords.
- **Interaction with Presentation Layer:**
  - Admin/analyst dashboards (like `DashboardOverview.jsx`, `UserManagement.jsx`, and other `dashboard/*` pages) use services from `userAPI` and future `dashboardAPI` to render cards, charts, and recent activity.
  - `UserManagement` (`client/src/pages/dashboard/UserManagement.jsx`) interacts with `userAPI.getAll`, `.create`, `.update`, `.delete` to manage dashboard access.

### 5. Security & Access Control Module
- **Files:**
  - `server/middleware/auth.middleware.js`
- **Key responsibilities (Business Logic):**
  - `verifyToken` ensures that only authenticated users can access protected routes.
  - `requireAdmin` enforces that certain management resources are accessible only to admin users.
  - Centralizes token validation so all BLL controllers can assume `req.user` exists and includes `userId` and `role`.
- **Interaction with Presentation Layer:**
  - All React pages that rely on secure data (dashboards, payments, accounts) use an Axios interceptor in `client/src/services/api.js` to automatically attach `Authorization: Bearer <token>`.
  - If the token is missing/invalid, protected routes return 401/403 and the UI can redirect users back to sign‑in.

---

## Q2. Detailed BLL Design

### A) Business Rules Implementation Across Modules

1. **Authentication & User Management Rules**
   - **Unique Users:** `auth.controller.js` checks for existing users with the same email before creating a new account. This enforces a one‑user‑per‑email rule.
   - **Password Security:** Passwords are never stored in plain text. They are hashed with bcrypt before saving in `User` model.
   - **Token‑based Sessions:** After successful sign‑in/sign‑up, a JWT is generated. The expiry depends on the `rememberMe` flag (e.g., longer expiry if the user wants persistent login).
   - **Role‑based Access:** `auth.middleware.js` embeds `role` in the JWT. `requireAdmin` ensures that only admin users can perform certain management operations (e.g., user management for dashboards).

2. **Account Management Rules**
   - **Default Account Creation:** If an existing user has no `accounts` entry, `ensureDefaultAccount` automatically creates a default account with a masked number and starting balance.
   - **New Accounts:** When adding a new account, the system:
     - Generates a unique `accountId` using MongoDB ObjectId.
     - Automatically masks the account number (`**** **** **** 1234`).
     - Sets a default initial balance (e.g., 1000 units).
   - **Per‑User Isolation:** All account operations always use `req.user.userId`, ensuring users only see and modify their own accounts.

3. **Transaction & Fraud Rules**
   - **Risk‑based Decisions:** `createTransaction` labels each transaction as:
     - `blocked` with very high risk when the amount is greater than a hard threshold (e.g., 100000).
     - `flagged` for analyst review when the amount is between configured ranges.
     - `approved` by default for normal amounts.
   - **Balance Update Rules:** User balances are decremented only when transactions are not `blocked`. This protects against losing money for fraudulent or highly suspicious payments.
   - **Per‑Account Balancing:** When an `accountId` is supplied, only that account’s balance is updated; otherwise, a legacy `accountBalance` field is used.
   - **Ownership & Disputes:** `raiseDispute` verifies that the transaction belongs to the current user and that a dispute has not already been raised.

4. **Dashboard & Admin Rules**
   - **Aggregation Rules:** `dashboard.controller.js` applies MongoDB aggregations (`countDocuments`, `aggregate`) to compute overall system health metrics for the admin/analyst dashboards.
   - **Recent User Logic:** Recently created users are defined as those registered within the last 7 days.
   - **Role and Status Metrics:** The system groups users by `role` and `status` to support admin decisions and reports.

5. **Security Rules**
   - **Access Control:** All account, transaction, and dashboard routes are wrapped with `verifyToken`, ensuring only authenticated calls reach deeper BLL logic.
   - **Admin‑only Operations:** Management actions such as creating, updating, or deleting users (in the admin UI) are restricted to admins.

### B) Validation Logic in the Application

Validation is implemented in **multiple layers** to ensure robust data quality.

1. **Backend (Server‑side Validation)**
   - **Auth Validation (auth.controller.js):**
     - Checks that `name`, `email`, and `password` are present during sign‑up.
     - Validates email format using a regex.
     - Ensures password length is at least 6 characters.
     - Prevents duplicate registrations by checking existing email.
   - **Sign‑in Validation:**
     - Ensures `email` and `password` are present and email format is correct.
     - Compares the incoming password to the stored hash and rejects invalid combinations with a generic error message.
   - **Dispute Validation (transaction.controller.js):**
     - Ensures the transaction exists and belongs to the current user.
     - Prevents raising a dispute multiple times on the same transaction.
   - **JWT Validation (auth.middleware.js):**
     - Confirms the access token is present and valid before allowing access to protected resources.

2. **Frontend (Client‑side Validation)**
   - **SignUp & SignIn Forms:**
     - Check for required fields (`name`, `email`, `password`, `confirmPassword`).
     - Validate email format with regex before sending it to the server.
     - Enforce minimal password length.
     - Ensure `password` and `confirmPassword` match.
   - **MakePayment Form:**
     - Validates that an account is selected.
     - Ensures amount is a positive number.
     - Requires recipient and location fields to be non‑empty.
   - **Dispute Modal in CustomerDashboard:**
     - Requires a non‑empty dispute reason before allowing the submit.

By combining both client‑side (for quick feedback) and server‑side (for security) validation, the system ensures that only valid, well‑structured data is processed and stored.

### C) Data Transformation Between Data Layer and Presentation Layer

1. **Between Database (MongoDB) and Controllers (BLL)**
   - Mongoose models (`User`, `Transaction`) transform raw MongoDB documents into structured JavaScript objects with:
     - Default values (e.g., account balances, default roles, timestamps).
     - Nested structures like `user.accounts` for multi‑account support.
   - Aggregation in `dashboard.controller.js` converts many user documents into summarized statistics objects (counts per role, status, etc.).

2. **Between Controllers and React UI**
   - Controllers return **clean JSON payloads** tailored for the UI, for example:
     - `auth.controller.js` returns `{ success, message, token, user: { id, email, name, role } }` so the frontend can store a compact `user` object.
     - `account.controller.js` returns `{ success, accounts: [...] }`, where each account already has a masked `accountNumber` and `balance` ready to display.
     - `transaction.controller.js` returns meaningful fields such as `status`, `riskScore`, `disputeStatus`, and timestamps that the UI converts into labels, colors, and formatted dates.
     - `dashboard.controller.js` returns a structured `stats` object that maps easily to cards, charts, and KPI widgets in the admin/analyst dashboards.

3. **Within the React Presentation Layer**
   - The frontend adapts server data for the visual components:
     - `CustomerDashboard.jsx` transforms transaction arrays into tables, CSV downloads, and filtered views by account.
     - `MakePayment.jsx` maps accounts into `<select>` options and uses `accountId` when building the `createTransaction` request.
     - `UserManagement.jsx` maps `users` into interactive table rows with controls for toggling status, editing, or deleting.
   - Dates (`createdAt`) are converted to local date and time strings before display.
   - Risk and status values are mapped to UI states (colors, badges, icons) so users can quickly interpret the fraud risk of each transaction.

Overall, the BLL ensures that **raw database data is always translated into domain‑specific objects** (users, accounts, transactions, stats) and then into **UI‑friendly JSON responses** that the React front end can easily render.
