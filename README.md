# Automated Fraud Detection System

A MERN stack application that simulates a bank's online transaction platform
with a built-in, admin-configurable fraud detection engine. Users sign up,
link bank accounts, and send transfers; every transfer is checked in real
time against a rules-based risk engine that flags or blocks suspicious
activity. Admins and analysts get a dashboard to manage those rules, review
transactions, handle disputes and support requests, and audit every
administrative action.

This repository is also the deliverable set for a Software Engineering
lab course — see [Coursework & SDLC Artifacts](#coursework--sdlc-artifacts)
below for the lab reports, diagrams, and assignment PDFs alongside the app.

## The Application

The actual app lives in [`DEVELOPMENT-MODULES/`](./DEVELOPMENT-MODULES).
Start there for setup instructions, environment variables, API docs, and
test credentials:

- [`DEVELOPMENT-MODULES/README.md`](./DEVELOPMENT-MODULES/README.md) — full documentation
- [`DEVELOPMENT-MODULES/QUICKSTART.md`](./DEVELOPMENT-MODULES/QUICKSTART.md) — fastest path to a running app
- [`DEVELOPMENT-MODULES/TEST-CREDENTIALS.md`](./DEVELOPMENT-MODULES/TEST-CREDENTIALS.md) — seeded demo accounts

### Quick start

```bash
cd DEVELOPMENT-MODULES
npm install && npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run seed   # optional demo users, requires MongoDB running
npm run dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:5000` · Health check: `http://localhost:5000/api/health`

### Features

- **Authentication** — JWT email/password sign-in, with optional Google/GitHub OAuth.
- **Role-based access** — `user`, `analyst`, and `admin` roles with separate dashboards.
- **Bank accounts & transactions** — users link accounts and send transfers.
- **Automated fraud detection engine** — admins configure risk rules
  (`IF amount > 5000 THEN block`, `IF recipient contains "scam" THEN flag`, ...)
  from the Risk Rules dashboard. Every transaction is evaluated against
  enabled rules in real time; matches are flagged or blocked with the
  triggering rule(s) recorded on the transaction. With no custom rules
  configured, a baseline amount threshold still applies.
- **Admin/analyst dashboard** — transaction monitoring with manual
  override, user management, account reactivation requests, customer
  support tickets, system settings, and maintenance-mode lockout.
- **Audit & compliance logging** — every administrative action (rule
  changes, settings updates, manual transaction review, unblocking a user)
  is recorded to an audit trail.

### Tech stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Radix UI
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT, Passport (Google/GitHub OAuth)
- **Testing:** Jest, Supertest, mongodb-memory-server

## Repository Layout

```text
.
├── DEVELOPMENT-MODULES/   # The application (client + server) - start here
├── LAB-2 .. LAB-9/        # Course lab deliverables (UML, diagrams, test reports, discussions)
├── Assignment pdfs/       # Course assignment PDFs
├── RequrimentsAnalysis.md # Requirements analysis document
└── pictorial.png          # System diagram
```

## Coursework & SDLC Artifacts

These folders document the software engineering process behind the app and
are course deliverables, kept alongside the code rather than in the app
itself:

| Folder | Contents |
| --- | --- |
| `LAB-2/` | UML diagrams and relationship documentation |
| `LAB-3/` | Class diagram, data flow diagrams (Level 0/1) |
| `LAB-4/` | Design discussion |
| `LAB-5/` | Deployment plan, system diagram |
| `LAB-6/` | Lab report |
| `LAB-7/` | Lab report |
| `LAB-8/` | Task reports, testing report |
| `LAB-9/` | Assignment execution & testing reports |
| `Assignment pdfs/` | Assignment briefs and theory submissions |
| `RequrimentsAnalysis.md` | Requirements analysis |

## Testing

From `DEVELOPMENT-MODULES/server/`:

```bash
npm test
```

Unit tests for controllers, middleware, and the fraud detection engine run
against mocked models with no external dependencies. The `*.api.test.js`
integration suites additionally boot an in-memory MongoDB instance via
`mongodb-memory-server`, which requires outbound network access to fetch its
binary on first run.
