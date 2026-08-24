# Development Modules: The Fraud Detection Application

This folder contains the actual application for the Automated Fraud Detection System —
a MERN stack app with authentication, per-user bank accounts, transaction monitoring,
an automated risk-rules fraud detection engine, and an admin/analyst dashboard.

It includes:
- React + Vite frontend (`client/`)
- Express + MongoDB backend (`server/`)
- JWT-based auth (email/password), with optional OAuth sign-in (Google, GitHub)
- Role-based access: `user`, `analyst`, `admin`

## Features

- **Accounts & Transactions** — users link bank accounts and send transfers
  (`MakePayment.jsx`); every transaction is evaluated in real time.
- **Automated Fraud Detection (Risk Rules engine)** — admins define rules
  (e.g. `IF amount > 5000 THEN block`, `IF recipient contains "scam" THEN block`)
  from the `RiskRules.jsx` dashboard. Each transaction is checked against every
  enabled rule (`server/services/fraudEngine.js`); when a rule matches, the
  transaction is flagged or blocked and the triggering rule(s) are recorded on
  it. If no rules are configured, the engine falls back to a baseline amount
  threshold so detection is never silently off.
- **Admin/Analyst Dashboard** — transaction monitoring, user management,
  compliance/audit logs, reactivation & support ticket handling, system
  settings (including maintenance-mode lockout).
- **Audit Logging** — every administrative action (rule changes, settings
  updates, manual transaction review, user unblocks) is written to an audit
  trail viewable under Compliance & Audit.

## Project Structure

```text
DEVELOPMENT-MODULES/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SignIn.jsx, SignUp.jsx, OAuthSuccess.jsx
│   │   │   ├── CustomerDashboard.jsx, UserDashboard.jsx, MakePayment.jsx
│   │   │   ├── AccountSuspended.jsx, Maintenance.jsx
│   │   │   └── dashboard/
│   │   │       ├── DashboardOverview.jsx, TransactionMonitoring.jsx
│   │   │       ├── RiskRules.jsx          # Fraud detection rule builder (admin)
│   │   │       ├── UserManagement.jsx, ReactivationRequests.jsx
│   │   │       ├── SupportTickets.jsx, ComplianceLogs.jsx, SystemSettings.jsx
│   │   ├── components/layout/ (Sidebar, MainLayout)
│   │   ├── services/api.js                # All backend API calls
│   │   ├── App.jsx                        # Route definitions
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/            # database.js, passport.js
│   ├── controllers/       # auth, user, account, transaction, riskRule,
│   │                       # setting, audit, support, dashboard
│   ├── middleware/         # auth.middleware.js (verifyToken, requireAdmin)
│   ├── models/             # User, Transaction, RiskRule, Setting,
│   │                       # AuditLog, SupportTicket, ReactivationRequest
│   ├── routes/
│   ├── services/
│   │   └── fraudEngine.js  # Rule evaluation engine used by transaction.controller
│   ├── tests/               # Jest unit + supertest integration tests
│   ├── .env.example
│   ├── server.js
│   ├── seedDatabase.js
│   └── package.json
├── QUICKSTART.md
├── TEST-CREDENTIALS.md
└── package.json
```

## Requirements

- Node.js 18+ (recommended for Vite 5)
- npm
- MongoDB (local or Atlas)

## Setup

From `DEVELOPMENT-MODULES/`:

```bash
npm install
npm run install:all
```

Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## Environment Variables

### `server/.env`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
CALLBACK_URL=http://localhost:5000
MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
JWT_SECRET=change-this
SESSION_SECRET=change-this
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

## Run

From `DEVELOPMENT-MODULES/`:

```bash
npm run dev
```

This starts both services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

Run individually:

```bash
npm run dev:server
npm run dev:client
```

## Seed Demo Users

```bash
npm run seed
```

Clears existing users and creates the accounts listed in
[`TEST-CREDENTIALS.md`](./TEST-CREDENTIALS.md) (admin, analyst, and user
roles across `@fraudshield.com`).

## Tests

From `DEVELOPMENT-MODULES/server/`:

```bash
npm test
```

Unit tests (controllers, middleware, the fraud engine) run against mocked
models. The `*.api.test.js` integration suites additionally spin up an
in-memory MongoDB via `mongodb-memory-server`, which needs outbound network
access the first time it downloads its binary.

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/signin` | Sign in with email/password |
| GET | `/api/auth/me` | Get current user (Bearer token required) |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| GET | `/api/users` | List users (admin) |
| GET/POST/PUT/DELETE | `/api/users/:id` | Manage users (admin) |
| GET | `/api/accounts/my-accounts` | List the current user's bank accounts |
| POST | `/api/accounts` | Add a bank account |
| POST | `/api/accounts/add-money` | Deposit into an account |
| GET | `/api/transactions/my-transactions` | Current user's transaction history |
| POST | `/api/transactions/create` | Create a transaction (runs the fraud engine) |
| GET | `/api/transactions/all` | List all transactions (admin/analyst) |
| PATCH | `/api/transactions/:id/status` | Manually review/override a transaction (admin/analyst) |
| POST | `/api/transactions/:id/dispute` | Raise a dispute on a transaction |
| GET | `/api/rules` | List risk rules (admin) |
| POST | `/api/rules` | Create a risk rule (admin) |
| PUT | `/api/rules/:id` | Update or enable/disable a risk rule (admin) |
| DELETE | `/api/rules/:id` | Delete a risk rule (admin) |
| GET | `/api/audit/logs` | List audit/compliance logs (admin) |
| GET | `/api/settings` | Get system settings (admin) |
| PUT | `/api/settings` | Update system settings (admin) |
| POST | `/api/support/contact` | Submit a support ticket (public) |
| GET | `/api/support/tickets` | List support tickets (admin) |
| GET | `/api/dashboard/stats` | Dashboard summary stats (admin/analyst) |
| GET | `/api/health` | Health and integration status |

Notes:
- OAuth routes return `503` if provider credentials are not configured.
- `oauth-success` redirects back to frontend route: `/oauth-success?token=<jwt>`.
- Risk rule and settings routes require an `admin` role token.

## Root Scripts (`DEVELOPMENT-MODULES/package.json`)

- `npm run install:client`
- `npm run install:server`
- `npm run install:all`
- `npm run dev`
- `npm run dev:client`
- `npm run dev:server`
- `npm run build:client`
- `npm run seed`

## Troubleshooting

- Port conflicts:
  Update `PORT`, `CLIENT_URL`, `CALLBACK_URL`, and `VITE_API_URL` consistently.
- MongoDB errors:
  Verify `MONGODB_URI` and that MongoDB is reachable.
- 401/403 on protected routes:
  Ensure `Authorization: Bearer <token>` header is sent.
- OAuth callback mismatch:
  Set provider callback to:
  - Google: `http://localhost:5000/api/auth/google/callback`
  - GitHub: `http://localhost:5000/api/auth/github/callback`
