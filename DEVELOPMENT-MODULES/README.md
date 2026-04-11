# Development Modules: Authentication and Role Dashboards

This folder contains the standalone auth and dashboard module used in the Automated Fraud Detection System.

It includes:
- React + Vite frontend in `client/`
- Express + MongoDB backend in `server/`
- JWT auth with email/password
- Optional Google and GitHub OAuth
- Role-based routing for admin, analyst, and user dashboards

## Project Structure

```text
DEVELOPMENT-MODULES/
|-- client/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- services/api.js
|   |   |-- pages/
|   |   |   |-- SignIn.jsx
|   |   |   |-- SignUp.jsx
|   |   |   |-- OAuthSuccess.jsx
|   |   |   |-- AnalystDashboard.jsx
|   |   |   `-- CustomerDashboard.jsx
|   |-- .env.example
|   `-- package.json
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- .env.example
|   |-- server.js
|   `-- seedDatabase.js
|-- QUICKSTART.md
|-- TEST-CREDENTIALS.md
`-- package.json
```

## Requirements

- Node.js 18+
- npm
- MongoDB local or Atlas

## Setup

From `DEVELOPMENT-MODULES/`:

```bash
npm install
npm run install:all
```

Copy the example env files:

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
MONGODB_URI=mongodb://127.0.0.1:27017/fraud-detection-auth
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
VITE_WS_URL=
```

`VITE_WS_URL` is optional. Leave it blank unless a WebSocket server is available.

## Run

From `DEVELOPMENT-MODULES/`:

```bash
npm run dev
```

This starts:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Seed Demo Users

```bash
npm run seed
```

This resets auth users and creates demo accounts. See `TEST-CREDENTIALS.md` for the full list. Common logins:
- `admin@fraudshield.com` / `Admin@123`
- `analyst@fraudshield.com` / `Analyst@123`
- `user@fraudshield.com` / `User@123`

## Role Routing

After sign-in:
- `admin` -> `/admin-dashboard`
- `analyst` -> `/analyst/dashboard`
- `user` -> `/customer-dashboard`

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/signin` | Sign in with email/password |
| POST | `/api/auth/logout` | Clear the authenticated session |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/notifications/my` | Load current user notifications |
| PATCH | `/api/notifications/:id/read` | Mark a notification as read |
| GET | `/api/models` | Load model cards |
| POST | `/api/models/:id/train` | Start demo model training |
| POST | `/api/models/:id/stop` | Stop demo model training |
| POST | `/api/data-admin/restore-latest` | Restore latest backup |
| DELETE | `/api/data-admin/clear` | Clear operational data |
| GET | `/api/health` | Health status |

## Notes

- OAuth returns `503` until provider keys are configured.
- Live WebSocket updates stay disabled unless `VITE_WS_URL` is set.
