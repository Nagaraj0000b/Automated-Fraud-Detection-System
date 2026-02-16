# Development Modules: Authentication (MERN)

This folder contains the standalone authentication module used in the Automated Fraud Detection System.

It includes:
- React + Vite frontend (`client/`)
- Express + MongoDB backend (`server/`)
- JWT-based auth (email/password)
- Optional OAuth sign-in (Google, GitHub)

## Project Structure

```text
DEVELOPMENT-MODULES/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── OAuthSuccess.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── server.js
│   ├── seedDatabase.js
│   └── package.json
├── QUICKSTART.md
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

This clears existing users in the auth database and creates:
- `admin@fraud-detection.com` / `admin123`
- `user@fraud-detection.com` / `password123`

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
| GET | `/api/health` | Health and integration status |

Notes:
- OAuth routes return `503` if provider credentials are not configured.
- `oauth-success` redirects back to frontend route: `/oauth-success?token=<jwt>`.

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
