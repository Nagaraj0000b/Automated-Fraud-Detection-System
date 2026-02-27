# Quick Start (Development Modules)

Use this when you want the auth module running fast.

## 1. Install

From `DEVELOPMENT-MODULES/`:

```bash
npm install
npm run install:all
```

## 2. Configure Env Files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Minimum values:

`server/.env`
```env
PORT=5000
CLIENT_URL=http://localhost:3000
CALLBACK_URL=http://localhost:5000
MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
JWT_SECRET=change-this
SESSION_SECRET=change-this
```

`client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

## 3. Start MongoDB

Use local MongoDB or Atlas. If local, ensure it is running before starting the server.

## 4. Optional: Seed Demo Users

From `DEVELOPMENT-MODULES/`:

```bash
npm run seed
```

Creates:
- `admin@fraud-detection.com` / `admin123`
- `user@fraud-detection.com` / `password123`

## 5. Run App

From `DEVELOPMENT-MODULES/`:

```bash
npm run dev
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## 6. Verify Flow

1. Open `http://localhost:3000`
2. Create an account from `/signup` or sign in at `/signin`
3. Confirm redirect to `/dashboard`

## OAuth (Optional)

Set credentials in `server/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Provider callback URLs:
- Google: `http://localhost:5000/api/auth/google/callback`
- GitHub: `http://localhost:5000/api/auth/github/callback`

## Common Issues

- Backend unreachable:
  Verify `VITE_API_URL` points to the active backend port.
- CORS errors:
  Ensure `CLIENT_URL` matches frontend origin.
- OAuth redirect mismatch:
  Match callback URLs in both provider dashboard and `CALLBACK_URL`.
