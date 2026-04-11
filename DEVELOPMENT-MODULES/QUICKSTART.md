# Quick Start (Development Modules)

Use this when you want the auth and dashboard module running fast.

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
MONGODB_URI=mongodb://127.0.0.1:27017/fraud-detection-auth
JWT_SECRET=change-this
SESSION_SECRET=change-this
```

`client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=
```

## 3. Start MongoDB

Use local MongoDB or Atlas. If local, make sure it is running before starting the server.

## 4. Seed Demo Users

From `DEVELOPMENT-MODULES/`:

```bash
npm run seed
```

Common demo accounts:
- `admin@fraudshield.com` / `Admin@123`
- `analyst@fraudshield.com` / `Analyst@123`
- `user@fraudshield.com` / `User@123`

More accounts are listed in `TEST-CREDENTIALS.md`.

## 5. Run App

From `DEVELOPMENT-MODULES/`:

```bash
npm run dev
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

## 6. Verify Flow

1. Open `http://localhost:3000`
2. Go to `/signin`
3. Pick the matching role tab
4. Confirm redirect:
   - Admin -> `/admin-dashboard`
   - Analyst -> `/analyst/dashboard`
   - User -> `/customer-dashboard`

## OAuth (Optional)

Set provider keys in `server/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Provider callbacks:
- Google: `http://localhost:5000/api/auth/google/callback`
- GitHub: `http://localhost:5000/api/auth/github/callback`

## Common Issues

- Backend unreachable:
  Check `VITE_API_URL` and confirm the server is running.
- CORS errors:
  Ensure `CLIENT_URL` matches the frontend origin.
- OAuth mismatch:
  Match callback URLs in both the provider dashboard and `CALLBACK_URL`.
- Live badge stuck on polling:
  This is expected until `VITE_WS_URL` points to a real WebSocket server.
